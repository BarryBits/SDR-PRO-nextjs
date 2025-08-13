import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/actions/dashboardActions";

export async function GET() {
  const { data, error } = await getUpcomingEvents();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}


