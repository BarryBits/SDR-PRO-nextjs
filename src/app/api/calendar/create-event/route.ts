import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/actions/calendarActions";

export async function POST(request: Request) {
  const eventData = await request.json();
  const { data, error } = await createCalendarEvent(eventData);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}


