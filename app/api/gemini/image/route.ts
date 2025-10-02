import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Image generation has been removed from this app." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Image generation has been removed from this app." },
    { status: 410 }
  );
}
