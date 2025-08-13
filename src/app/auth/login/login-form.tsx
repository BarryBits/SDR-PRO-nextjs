"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/actions/authActions";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock, Eye, EyeOff, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error("Erro ao fazer login", {
        description: decodeURIComponent(error),
      });
      window.history.replaceState(null, "", "/auth/login");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Ilustração/Gradiente Corporativo */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-heading font-bold">SDR PRO</h1>
            </div>
            <h2 className="text-4xl font-heading font-bold leading-tight">
              Transforme Leads em Oportunidades
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Plataforma premium de automação de vendas com IA avançada para maximizar suas conversões e acelerar seu crescimento empresarial.
            </p>
            <div className="grid grid-cols-1 gap-4 mt-8">
                <div className="flex items-center space-x-3"><div className="w-2 h-2 bg-accent rounded-full"></div><span className="text-white/90">Automação inteligente de campanhas</span></div>
                <div className="flex items-center space-x-3"><div className="w-2 h-2 bg-accent rounded-full"></div><span className="text-white/90">Gestão avançada de leads</span></div>
                <div className="flex items-center space-x-3"><div className="w-2 h-2 bg-accent rounded-full"></div><span className="text-white/90">Analytics em tempo real</span></div>
            </div>
          </div>
        </div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-accent/30 rounded-full blur-lg"></div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <Card className="card-premium shadow-premium border-0">
            <CardHeader className="text-center space-y-2 pb-6">
                <div className="hidden lg:flex items-center justify-center space-x-3 mb-4"><div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-primary-foreground" /></div><h1 className="text-2xl font-heading font-bold text-gradient">SDR PRO</h1></div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Bem-vindo de volta</h2>
                <p className="text-muted-foreground">Plataforma de automação de vendas premium</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form action={signIn} onSubmit={() => setIsLoading(true)} className="space-y-4">
                <div className="form-field">
                  <Label htmlFor="email" className="form-label">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Digite seu email"
                      className="form-input pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <Label htmlFor="password" className="form-label">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      className="form-input pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="btn-primary w-full h-12 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Entrar na Plataforma"
                  )}
                </Button>
              </form>

              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-card text-muted-foreground">ou continue com</span></div></div>
              <Button variant="outline" className="w-full h-12 hover-lift" disabled><span className="font-medium">Login com Google (Desabilitado)</span></Button>
              <div className="text-center pt-4 space-y-2"><p className="text-sm text-muted-foreground">Não tem uma conta?{" "}<a href="https://atrgrowthbusiness.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-medium transition-colors">Entre em contato</a></p><p className="text-xs text-muted-foreground">Powered by{" "}<span className="font-semibold text-foreground">ATR Growth Business</span></p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}