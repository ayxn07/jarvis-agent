import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Realtime ICE exchange disabled. Gemini REST path is in use." },
    { status: 410 }
  );
}
