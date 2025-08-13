import { AppShell } from "@/components/layout/app-shell";
import { DashboardProvider } from "@/context/dashboard-context";
import { getUser } from "@/actions/authActions";
import { redirect } from "next/navigation";

export default async function ProtectedShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // ADICIONE ESTE LOG PARA VERIFICAR O LADO DO SERVIDOR
  console.log("--- CHECAGEM NO LAYOUT DO SERVIDOR ---");
  console.log("Usuário encontrado:", user ? user.email : null);

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <DashboardProvider>
      <AppShell>{children}</AppShell>
    </DashboardProvider>
  );
}