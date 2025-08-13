import { NextResponse } from "next/server";
import { getUser } from "@/actions/authActions";

export async function GET() {
  const user = await getUser();

  // ADICIONE ESTE LOG PARA VERIFICAR O LADO DA API
  console.log("--- CHECAGEM NA ROTA DA API ---");
  console.log("Usuário encontrado:", user ? user.email : null);

  if (!user) {
    return NextResponse.json({ message: "Usuário não autenticado" }, { status: 401 });
  }
  return NextResponse.json(user);
}