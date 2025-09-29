import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_IMAGE_MODEL = "imagegeneration@005";

const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  aspectRatio: z.string().optional(),
  negativePrompt: z.string().optional(),
  model: z.string().optional(),
  numberOfImages: z.number().int().min(1).max(4).optional()
});

function normalizeImageModel(input?: string) {
  if (!input) return DEFAULT_IMAGE_MODEL;
  let trimmed = input.trim();
  if (!trimmed) return DEFAULT_IMAGE_MODEL;

  let lower = trimmed.toLowerCase();
  if (lower.startsWith("models/")) {
    trimmed = trimmed.slice(7);
    lower = trimmed.toLowerCase();
  }

  if (lower.startsWith("imagen")) {
    return DEFAULT_IMAGE_MODEL;
  }

  if (lower.startsWith("imagegeneration@")) {
    return trimmed;
  }

  return DEFAULT_IMAGE_MODEL;
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { prompt, aspectRatio, negativePrompt, model, numberOfImages } = parsed.data;
  const targetModel = normalizeImageModel(model);

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generate`
  );
  url.searchParams.set("key", process.env.GEMINI_API_KEY);

  const requestBody: Record<string, unknown> = {
    prompt: { text: prompt },
    imageCount: numberOfImages ?? 1
  };

  if (negativePrompt) {
    requestBody.negativePrompt = { text: negativePrompt };
  }
  if (aspectRatio) {
    requestBody.aspectRatio = aspectRatio;
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof (errorBody as { error?: { message?: string } }).error?.message === "string"
        ? (errorBody as { error: { message: string } }).error.message
        : `Image generation failed (${response.status})`;
    return NextResponse.json({ error: message }, { status: response.status });
  }

  const data = (await response.json()) as {
    images?: Array<{
      image?: { base64Data?: string; mimeType?: string };
      base64Data?: string;
      b64?: string;
      mimeType?: string;
      fileUri?: string;
    }>;
    promptFeedback?: unknown;
  };

  const images = (data.images ?? [])
    .map((item, index) => {
      const base64 =
        item?.image?.base64Data ?? item?.base64Data ?? item?.b64 ?? "";
      const mimeType = item?.image?.mimeType ?? item?.mimeType ?? "image/png";
      if (!base64) return null;
      return {
        id: item?.fileUri ?? `image-${index}`,
        base64,
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`
      };
    })
    .filter((img): img is { id: string; base64: string; mimeType: string; dataUrl: string } => Boolean(img));

  if (!images.length) {
    return NextResponse.json({ error: "Image generation returned no images" }, { status: 502 });
  }

  return NextResponse.json({
    model: targetModel,
    images,
    promptFeedback: data.promptFeedback
  });
}
