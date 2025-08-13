import { NextResponse } from "next/server";
import { getRecentActivity } from "@/actions/dashboardActions";

export async function GET() {
  const { data, error } = await getRecentActivity();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}


