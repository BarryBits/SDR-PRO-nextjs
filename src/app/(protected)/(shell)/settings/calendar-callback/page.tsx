"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// CORREÇÃO 6: Adicionando a importação do AlertCircle
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CardTitle, CardDescription } from "@/components/ui/card";

export default function CalendarCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  useEffect(() => {
    // Redireciona para a página de consultores após 5 segundos em caso de sucesso
    if (status === 'success') {
      const timer = setTimeout(() => {
        router.push('/consultants');
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, router]);

  const renderContent = () => {
    if (!status) {
      return (
        <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary"/>
            <p className="text-muted-foreground">Processando autenticação da agenda...</p>
        </div>
      );
    }
    
    if (status === 'success') {
      return (
        <div className="text-center space-y-4 text-success">
            <CheckCircle className="h-16 w-16 mx-auto"/>
            <CardTitle>Agenda Conectada com Sucesso!</CardTitle>
            <CardDescription>
                Você será redirecionado para a página de consultores em alguns segundos.
            </CardDescription>
            <Button onClick={() => router.push('/consultants')}>
                Voltar Agora
            </Button>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-4 text-destructive">
                <XCircle className="h-16 w-16 mx-auto"/>
                <CardTitle>Falha na Conexão da Agenda</CardTitle>
            </div>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{error || "Erro Desconhecido"}</AlertTitle>
                <AlertDescription>
                {message || "Não foi possível completar a conexão com a agenda. Por favor, tente novamente ou contate o suporte."}
                </AlertDescription>
            </Alert>
            <div className="text-center">
                <Button variant="outline" onClick={() => router.push('/consultants')}>
                    Voltar para Consultores
                </Button>
            </div>
        </div>
    );
  };

  return (
    <div className="flex items-center justify-center h-full py-12">
        <Card className="w-full max-w-lg p-6">
            <CardContent className="pt-6">
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
}