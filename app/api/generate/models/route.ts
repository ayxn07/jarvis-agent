import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const list = await ai.models.list();
    const models = (list as any)?.models ?? [];

    const imageCapable = models.filter((m: any) => {
      const name = (m.name || "").toLowerCase();
      const outputs = (m.outputModalities || m.modalities || []).map((x: string) => x.toLowerCase());
      return name.includes("image") || name.includes("imagen") || outputs.includes("image");
    });

    return NextResponse.json(
      imageCapable.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        outputModalities: m.outputModalities || m.modalities
      }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list models" }, { status: 500 });
  }
}
