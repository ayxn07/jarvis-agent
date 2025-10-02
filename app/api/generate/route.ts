import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, Modality } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(4000),
  model: z.string().optional()
});

export async function GET() {
  const defaultModel = process.env.IMAGE_MODEL || "gemini-2.5-flash-image-preview";
  return NextResponse.json({
    message: "POST JSON with { prompt, model? } to generate an image using Gemini.",
    defaultModel
  });
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { prompt, model } = parsed.data;
  const MODEL = (model && model.trim()) || process.env.IMAGE_MODEL || "gemini-2.5-flash-image-preview";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] }
    });

    const parts = res.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: any) => p?.inlineData)?.inlineData as
      | { data: Uint8Array | string; mimeType?: string }
      | undefined;

    if (!imagePart) {
      const text = parts.map((p: any) => p?.text).filter(Boolean).join("\n");
      return NextResponse.json({ error: "No image returned", text }, { status: 200 });
    }

    const bytes = imagePart.data as any;
    const base64 =
      typeof bytes === "string"
        ? bytes
        : Buffer.from(bytes as Uint8Array).toString("base64");
    const mime = imagePart.mimeType || "image/png";
    const dataUrl = `data:${mime};base64,${base64}`;

    return NextResponse.json({ image: dataUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
