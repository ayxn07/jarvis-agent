import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  text: z.string().min(1),
  voiceId: z.string().optional()
});

const DEFAULT_MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_monolingual_v2";
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "Smxkoz0xiOoHo5WcSskf";

export async function POST(request: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured" }, { status: 500 });
  }

  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid TTS payload" }, { status: 400 });
  }

  const { text, voiceId } = parsed.data;
  const targetVoice = (voiceId?.trim() ?? "") || DEFAULT_VOICE_ID;

  if (!targetVoice) {
    return NextResponse.json({ error: "No ElevenLabs voice configured" }, { status: 500 });
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: DEFAULT_MODEL_ID,
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.85,
        style: 0.4,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return NextResponse.json(
      {
        error: `TTS provider error (${response.status}): ${errorText || response.statusText}`
      },
      { status: 500 }
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Response(Buffer.from(arrayBuffer), {
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "no-store"
    }
  });
}
