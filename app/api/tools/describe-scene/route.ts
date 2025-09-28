import { NextResponse } from "next/server";

import { describeSceneSchema } from "@/app/api/tools/schemas";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = describeSceneSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { detailLevel } = parsed.data;

  // Placeholder logic; integrate with vision backend or embeddings later.
  const summary =
    detailLevel === "detailed"
      ? "Vision analysis placeholder: integrate OCR/object detection in future milestone."
      : "Vision analysis pending";

  return NextResponse.json({
    summary,
    items: [],
    ocrText: null
  });
}
