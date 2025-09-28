import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    site: process.env.SITE_NAME ?? "Jarvis",
    model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash-latest"
  });
}
