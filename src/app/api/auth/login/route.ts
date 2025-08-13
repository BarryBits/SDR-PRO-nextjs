import { NextResponse } from "next/server";
import { signIn } from "@/actions/authActions";

export async function POST(request: Request) {
  const formData = await request.formData();
  const { error } = await signIn(formData);

  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  return NextResponse.json({ message: "Login bem-sucedido" });
}


