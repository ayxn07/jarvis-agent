import { NextResponse } from "next/server";

import { openLinkSchema } from "@/app/api/tools/schemas";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = openLinkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Defer actual navigation to client after confirmation.
  return NextResponse.json({ opened: true });
}
