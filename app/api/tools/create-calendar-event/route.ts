import { NextResponse } from "next/server";

import { createCalendarEventSchema } from "@/app/api/tools/schemas";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createCalendarEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { title, startISO, endISO, attendees } = parsed.data;

  const result = {
    id: `evt_${Math.random().toString(36).slice(2, 9)}`,
    title,
    startISO,
    endISO,
    attendees
  };

  // TODO: integrate with calendar provider (Google, Outlook, etc.)
  return NextResponse.json(result);
}
