// Caminho: src/app/api/campaigns/route.ts

import { NextResponse } from "next/server";
// CORREÇÃO: Importa a função com o nome correto e remove a que não existe.
import { getCampaigns, createCampaignWithLeads } from "@/actions/campaignActions";

/**
 * API Route para buscar campanhas.
 * Esta rota atua como um wrapper para a Server Action 'getCampaigns'.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // A action getCampaigns busca todas as campanhas, a paginação pode ser adicionada nela no futuro.
    const { data, error } = await getCampaigns();

    if (error) {
      throw new Error(error);
    }

    // Retorna os dados com o total baseado no comprimento do array, como estava.
    return NextResponse.json({ items: data, total: data?.length || 0 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro interno no servidor.";
    console.error("API GET /api/campaigns Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * API Route para criar uma nova campanha com leads a partir de um FormData.
 * Esta rota agora delega a chamada para a Server Action correta.
 */
export async function POST(request: Request) {
  try {
    // Server Actions que lidam com FormData (como upload de arquivos)
    // são chamadas diretamente pelo formulário no frontend.
    // Esta rota POST, que espera JSON, pode ser adaptada ou removida
    // dependendo se haverá uma forma de criar campanhas sem CSV via API.
    
    // Por enquanto, vamos assumir que ela não será usada pelo fluxo principal de CSV,
    // mas a corrigimos para apontar para a função correta caso seja necessária.
    // O ideal é que o formulário da UI use a Server Action diretamente.
    
    // Se a intenção é receber um FormData, a lógica seria:
    const formData = await request.formData();
    const { data, error } = await createCampaignWithLeads(formData);

    if (error) {
      throw new Error(error);
    }

    return NextResponse.json(data, { status: 201 }); // Status 201 para criação bem-sucedida.

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro interno no servidor.";
    console.error("API POST /api/campaigns Error:", errorMessage);
    // Retorna 400 para Bad Request, pois o erro provavelmente está nos dados enviados.
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
