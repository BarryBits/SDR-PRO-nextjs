// Caminho: src/app/(protected)/(shell)/settings/page.tsx
"use client";

/**
 * @file src/app/(protected)/(shell)/settings/page.tsx
 * @description Página de Configurações refatorada, com lógica unificada e UX aprimorada.
 *
 * @version 3.0.0 (Versão Refatorada e Unificada)
 * @author Gemini Dev Lead & [Seu Nome]
 *
 * @features
 * - Abas "IA" e "Prompts" foram unificadas para uma experiência mais coesa.
 * - Campos de "Temperatura" e "Max Tokens" da IA foram removidos para simplificar a interface.
 * - Adicionado campo "WhatsApp Business Account ID" para uma integração mais completa com a Meta.
 * - Adicionado botão "Verificar Conexão" para feedback imediato ao usuário.
 * - A lógica de salvamento foi centralizada e aprimorada com feedback visual (toast).
 */

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// --- Server Actions e Tipos ---
import { 
  getSettings, 
  updateSettings, 
  validateWhatsAppCredentials, // <-- Ação nova
  testOpenAIConnection,         // <-- Ação nova
  type Settings 
} from "@/actions/settingsActions";

// --- Componentes ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SystemPromptsManager } from "@/components/settings/SystemPromptsManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Ícones ---
import { 
  Settings as SettingsIcon,
  MessageSquare, 
  Bot, 
  Loader2, 
  AlertCircle, 
  Save,
  RefreshCw,
  Zap,
  Key,
  CheckCircle
} from "lucide-react";

// --- Constantes e Tipos ---
const OPENAI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido e Econômico)' },
  { value: 'gpt-4o', label: 'GPT-4o (Mais Avançado)' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSettings();
      if (result.error) throw new Error(result.error);
      setSettings(result.data || ({} as Settings));
    } catch (err: any) {
      setError(err.message);
      setSettings({} as Settings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSaveSettings = useCallback(async (section: 'whatsapp' | 'ai') => {
    setSaving(true);
    
    let settingsToUpdate: Partial<Settings> = {};
    if (section === 'whatsapp') {
      settingsToUpdate = {
        whatsapp_api_token: settings.whatsapp_api_token,
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id,
        whatsapp_business_account_id: settings.whatsapp_business_account_id
      };
    } else if (section === 'ai') {
      settingsToUpdate = {
        openai_api_key: settings.openai_api_key,
        ai_model: settings.ai_model,
      };
    }

    const promise = updateSettings({ ...settings, ...settingsToUpdate });
    toast.promise(promise, {
      loading: "Salvando configurações...",
      success: (result) => {
        if (result.error) throw new Error(result.error);
        if (result.data) setSettings(result.data);
        return "Configurações salvas com sucesso!";
      },
      error: (err) => `Erro ao salvar: ${err.message}`,
      finally: () => setSaving(false),
    });
  }, [settings]);

  const handleVerifyWhatsApp = useCallback(async () => {
    if (!settings.whatsapp_api_token || !settings.whatsapp_phone_number_id) {
      toast.error("Erro de Validação", {
        description: "Token da API e ID do Número de Telefone são obrigatórios para verificar a conexão."
      });
      return;
    }
    
    setVerifying(true);
    const promise = validateWhatsAppCredentials(
      "https://graph.facebook.com/v19.0", // A URL pode ser fixa
      settings.whatsapp_api_token,
      settings.whatsapp_phone_number_id
    );

    toast.promise(promise, {
      loading: "Verificando conexão com a API da Meta...",
      success: (result) => {
        if (!result.valid) throw new Error(result.error || "Credenciais inválidas.");
        return "Conexão com WhatsApp validada com sucesso!";
      },
      error: (err) => `Falha na conexão: ${err.message}`,
      finally: () => setVerifying(false),
    });
  }, [settings.whatsapp_api_token, settings.whatsapp_phone_number_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <SettingsIcon />
            Configurações
          </h1>
          <p className="text-muted-foreground">Configure as integrações e parâmetros do sistema.</p>
        </div>
        <Button onClick={fetchSettings} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />WhatsApp</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2"><Bot className="h-4 w-4" />IA & Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conexão com a API do WhatsApp</CardTitle>
              <CardDescription>Insira suas credenciais da Meta para ativar o envio de mensagens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="whatsapp_api_token">Token de Acesso Permanente</Label>
                <Input id="whatsapp_api_token" name="whatsapp_api_token" type="password" value={settings.whatsapp_api_token || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="whatsapp_phone_number_id">ID do Número de Telefone</Label>
                <Input id="whatsapp_phone_number_id" name="whatsapp_phone_number_id" value={settings.whatsapp_phone_number_id || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="whatsapp_business_account_id">ID da Conta Empresarial (Opcional)</Label>
                <Input id="whatsapp_business_account_id" name="whatsapp_business_account_id" value={settings.whatsapp_business_account_id || ""} onChange={handleInputChange} />
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <Button onClick={handleVerifyWhatsApp} variant="outline" disabled={verifying || saving}>
                  {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Verificar Conexão
                </Button>
                <Button onClick={() => handleSaveSettings('whatsapp')} disabled={saving || verifying}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Configurações do WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Inteligência Artificial</CardTitle>
              <CardDescription>Configure sua chave da OpenAI e o modelo de linguagem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openai_api_key">Chave da API OpenAI</Label>
                  <Input id="openai_api_key" name="openai_api_key" type="password" value={settings.openai_api_key || ""} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="ai_model">Modelo da IA</Label>
                  <Select name="ai_model" value={settings.ai_model || 'gpt-4o-mini'} onValueChange={(value) => handleSelectChange("ai_model", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPENAI_MODELS.map(model => (
                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('ai')} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações da IA
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* O Gerenciador de Prompts agora vive aqui dentro */}
          <SystemPromptsManager />

        </TabsContent>
      </Tabs>
    </div>
  );
}