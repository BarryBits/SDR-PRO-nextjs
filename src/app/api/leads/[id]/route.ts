import { NextResponse } from "next/server";
import { deleteLead, getLeadById } from "@/actions/leadActions";

/**
 * API Route para buscar um lead específico pelo ID.
 * @param request O objeto de requisição (não utilizado aqui).
 * @param params Contém o ID do lead extraído da URL.
 * @returns O lead encontrado ou uma mensagem de erro.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "O ID do lead é obrigatório." }, { status: 400 });
    }

    const { data, error } = await getLeadById(id);

    if (error) {
      throw new Error(error);
    }

    if (!data) {
      return NextResponse.json({ message: "Lead não encontrado." }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro interno no servidor.";
    console.error(`API GET /api/leads/${params.id} Error:`, errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * API Route para deletar um lead específico pelo ID.
 * @param request O objeto de requisição (não utilizado aqui).
 * @param params Contém o ID do lead extraído da URL.
 * @returns Uma mensagem de sucesso ou de erro.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "O ID do lead é obrigatório." }, { status: 400 });
    }
    
    const { success, error } = await deleteLead(id);

    if (error) {
      throw new Error(error);
    }

    // O 'success' pode ser false mesmo sem um erro explícito, por isso checamos ambos.
    if (!success) {
      return NextResponse.json({ message: "Falha ao excluir o lead." }, { status: 500 });
    }

    return NextResponse.json({ message: "Lead excluído com sucesso." });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro interno no servidor.";
    console.error(`API DELETE /api/leads/${params.id} Error:`, errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
