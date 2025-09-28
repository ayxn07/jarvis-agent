import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Realtime signaling is no longer available. The application now uses Gemini REST endpoints." },
    { status: 410 }
  );
}
