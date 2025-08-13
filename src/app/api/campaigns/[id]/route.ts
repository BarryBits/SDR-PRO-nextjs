import { NextRequest, NextResponse } from "next/server";
import { updateCampaign } from "@/actions/campaignActions";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const campaignData = await request.json();
  const { data, error } = await updateCampaign(id, campaignData);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}


