import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/actions/dashboardActions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "";

  const { data, error } = await getDashboardSummary(period);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}


