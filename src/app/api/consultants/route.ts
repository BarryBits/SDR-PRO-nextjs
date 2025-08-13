export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getConsultants } from "@/actions/consultantActions";

export async function GET(request: Request) {
  const { data, error } = await getConsultants();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}


