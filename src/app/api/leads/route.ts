// DENTRO DE: src/app/api/leads/route.ts

import { NextResponse } from "next/server";
import { getLeads } from "@/actions/leadActions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // CORREÇÃO: Agora a função getLeads aceita page e limit e retorna o total
  const { data, total, error } = await getLeads({ page, limit });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ items: data, total });
}