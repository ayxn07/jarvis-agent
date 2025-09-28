import { GoogleGenerativeAI, type Content, type Part } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "gemini-2.5-flash";

const requestSchema = z.object({
  text: z.string().optional(),
  imageBase64: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().optional(),
        image: z.string().optional()
      })
    )
    .default([]),
  model: z.string().optional()
});

function normalizeModel(name?: string) {
  if (!name) return DEFAULT_MODEL;
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_MODEL;

  let lower = trimmed.toLowerCase();
  if (lower.startsWith("models/")) {
    lower = lower.replace("models/", "");
  }

  if (lower.startsWith("gpt-")) return DEFAULT_MODEL;
  if (lower.startsWith("gemini-1.5")) return DEFAULT_MODEL;

  return lower;
}

function inlineDataFrom(raw?: string) {
  if (!raw) return undefined;
  if (!raw.startsWith("data:")) {
    return { data: raw, mimeType: "image/jpeg" };
  }
  const comma = raw.indexOf(",");
  if (comma === -1) return { data: raw, mimeType: "image/jpeg" };
  const meta = raw.slice(5, comma);
  const [mimeType] = meta.split(";");
  const data = raw.slice(comma + 1);
  return { data, mimeType: mimeType || "image/jpeg" };
}

function buildParts(item: { text?: string; image?: string }): Part[] {
  const parts: Part[] = [];
  if (item.text) parts.push({ text: item.text });
  const inline = inlineDataFrom(item.image);
  if (inline) parts.push({ inlineData: inline });
  return parts;
}

let cachedClient: GoogleGenerativeAI | null = null;
function getClient() {
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return cachedClient;
}

export async function GET() {
  return NextResponse.json({
    message: "POST JSON with { text, imageBase64 } to chat with Gemini."
  });
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { text, imageBase64, history, model } = parsed.data;
  if (!text && !imageBase64) {
    return NextResponse.json({ error: "Nothing to send" }, { status: 400 });
  }

  const generativeModel = getClient().getGenerativeModel({
    model: normalizeModel(model || process.env.GEMINI_MODEL),
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 2048,
      topP: 0.95,
      topK: 32
    }
  });

  const contents: Content[] = history.map((item) => ({
    role: item.role === "user" ? "user" : "model",
    parts: buildParts(item)
  }));
  contents.unshift({
    role: "user",
    parts: [
      {
        text: `You are Jarvis, a proactive multimodal assistant. Refer to yourself as Jarvis when it adds clarity, but avoid repeating your identity in every reply. Only when a user directly asks who you are, what your name is, or who built you should you confirm that you are Jarvis, note that you were created by Ayaan, and share his GitHub profile at github.com/ayxn07. Otherwise respond naturally with concise, helpful guidance. Use **bold** markdown only when emphasis is essential so the UI can style it, and keep language natural for text-to-speech.`
      }
    ]
  });
  contents.push({ role: "user", parts: buildParts({ text, image: imageBase64 }) });

  try {
    const result = await generativeModel.generateContent({ contents });
    const response = result.response;

    if (response.promptFeedback?.blockReason) {
      return NextResponse.json(
        { error: `Gemini refused the request: ${response.promptFeedback.blockReason}` },
        { status: 400 }
      );
    }

    const viaHelper = typeof response.text === "function" ? await response.text() : "";
    const fallback =
      response.candidates?.flatMap((candidate) =>
        candidate.content?.parts?.map((part) => part.text ?? "") ?? []
      ) ?? [];

    const finalText = (viaHelper || fallback.join(" ") || "I do not have a response right now.").trim();

    return NextResponse.json({ text: finalText.length > 0 ? finalText : "I do not have a response right now." });
  } catch (error) {
    console.error("Gemini call failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gemini call failed" },
      { status: 500 }
    );
  }
}


