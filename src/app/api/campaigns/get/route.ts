import { NextResponse } from "next/server";
import { getCampaigns } from "@/actions/campaignActions";

export async function GET() {
  const { data, error } = await getCampaigns();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}


