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
  model: z.string().optional(),
  models: z.array(z.string()).optional()
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

type ModelSuccess = { model: string; text: string };
type ModelFailure = { model: string; error: string };
type ModelResult = ModelSuccess | ModelFailure;

function isSuccess(result: ModelResult): result is ModelSuccess {
  return "text" in result;
}

function isFailure(result: ModelResult): result is ModelFailure {
  return "error" in result;
}

function modelsToQuery(primary?: string, extras: string[] = []) {
  const ordered: string[] = [];
  const push = (candidate?: string) => {
    if (!candidate) return;
    const normalized = normalizeModel(candidate);
    if (!ordered.includes(normalized)) {
      ordered.push(normalized);
    }
  };

  push(primary);
  extras.forEach((entry) => push(entry));

  if (ordered.length === 0) {
    push(process.env.GEMINI_MODEL);
  }
  if (ordered.length === 0) {
    ordered.push(DEFAULT_MODEL);
  }

  return ordered;
}

function buildContents(
  history: Array<{ role: "user" | "assistant"; text?: string; image?: string }>,
  prompt: { text?: string; imageBase64?: string }
) {
  const systemInstruction: Content = {
    role: "user",
    parts: [
      {
        text: `You are Jarvis, a proactive multimodal assistant. Refer to yourself as Jarvis when it adds clarity, but avoid repeating your identity in every reply. Only when a user directly asks who you are, what your name is, or who built you should you confirm that you are Jarvis, note that you were created by Ayaan, and share his GitHub profile at github.com/ayxn07. Otherwise respond naturally with concise, helpful guidance. Use **bold** markdown only when emphasis is essential so the UI can style it, and keep language natural for text-to-speech.`
      }
    ]
  };

  const historyContents: Content[] = history.map((item) => ({
    role: item.role === "user" ? "user" : "model",
    parts: buildParts(item)
  }));

  const finalUser: Content = {
    role: "user",
    parts: buildParts({ text: prompt.text, image: prompt.imageBase64 })
  };

  return [systemInstruction, ...historyContents, finalUser];
}

export async function GET() {
  return NextResponse.json({
    message: "POST JSON with { text, imageBase64, models? } to chat with Gemini."
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

  const { text, imageBase64, history, model, models } = parsed.data;
  if (!text && !imageBase64) {
    return NextResponse.json({ error: "Nothing to send" }, { status: 400 });
  }

  const targetModels = modelsToQuery(model || process.env.GEMINI_MODEL, models ?? []);

  const attemptModel = async (target: string): Promise<ModelResult> => {
    const generativeModel = getClient().getGenerativeModel({
      model: target,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 32
      }
    });

    try {
      const result = await generativeModel.generateContent({
        contents: buildContents(history, { text, imageBase64 })
      });
      const response = result.response;

      if (response.promptFeedback?.blockReason) {
        return {
          model: target,
          error: `Gemini refused the request: ${response.promptFeedback.blockReason}`
        };
      }

      const viaHelper = typeof response.text === "function" ? await response.text() : "";
      const fallback =
        response.candidates?.flatMap((candidate) =>
          candidate.content?.parts?.map((part) => part.text ?? "") ?? []
        ) ?? [];

      const finalText = (viaHelper || fallback.join(" ") || "I do not have a response right now.").trim();

      return {
        model: target,
        text: finalText.length > 0 ? finalText : "I do not have a response right now."
      };
    } catch (error) {
      return {
        model: target,
        error: error instanceof Error ? error.message : "Gemini call failed"
      };
    }
  };

  const results = await Promise.all(targetModels.map((target) => attemptModel(target)));
  const successes = results.filter(isSuccess);
  const failures = results.filter(isFailure);

  if (!successes.length) {
    const firstFailure = failures[0];
    return NextResponse.json(
      {
        error: firstFailure?.error ?? "Gemini call failed",
        failures
      },
      { status: 500 }
    );
  }

  const primary = successes[0];

  return NextResponse.json({
    outputs: successes,
    primary,
    text: primary.text,
    failures: failures.length ? failures : undefined
  });
}
