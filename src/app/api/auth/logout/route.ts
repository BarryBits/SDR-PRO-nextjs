import { NextResponse } from "next/server";
import { signOut } from "@/actions/authActions";

export async function POST() {
  await signOut();
  return NextResponse.json({ message: "Logout bem-sucedido" });
}


