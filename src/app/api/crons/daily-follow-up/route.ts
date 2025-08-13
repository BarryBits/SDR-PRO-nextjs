import { NextResponse } from "next/server";
import { getActionableInsights } from "@/actions/dashboardActions";

export const dynamic = 'force-dynamic';

/**
 * API Route para ser chamada pelo Vercel Cron Job diariamente.
 * O objetivo deste cron é executar a análise de 'getActionableInsights'
 * para identificar leads que precisam de um follow-up com template (fora da janela de 24h),
 * populando a Central de Ações no dashboard para o usuário.
 */
export async function GET() {
  console.log(`[CRON] Daily follow-up job started at: ${new Date().toISOString()}`);
  try {
    const { data: insights, error } = await getActionableInsights();
    if (error) {
      throw new Error(error);
    }
    
    const leadsFound = insights?.reduce((acc, insight) => acc + insight.leadCount, 0) || 0;
    console.log(`[CRON] Job finished. Found ${leadsFound} leads needing template follow-up.`);

    return NextResponse.json({ 
      message: "Daily follow-up check executed successfully.",
      leadsFound
    });
  } catch (error: any) {
    console.error("[CRON] Error in daily follow-up job:", error);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error", error: error.message }),
      { status: 500 }
    );
  }
}