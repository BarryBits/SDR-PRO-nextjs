// frontend/src/components/settings/settings-page.tsx
/**
 * Página de configurações completa - VERSÃO FINAL
 * Inclui validação de chave OpenAI e todas as melhorias sugeridas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, TestTube, Clock, MessageSquare, Brain, Shield, AlertTriangle, CheckCircle, Key } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SettingsData {
  prompt: string;
  openai_model: string;
  openai_api_key: string;
  is_followup_enabled: boolean;
  followup_intervals: number[];
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  max_followup_attempts: number;
  whatsapp_rate_limit: number;
  max_retry_delay: number;
}

interface SettingsStatus {
  openai_key_valid: boolean;
  followup_active_count: number;
  last_test_result: string | null;
}

const OPENAI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recomendado)', description: 'Rápido e econômico', cost: 'Baixo' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Mais avançado, maior custo', cost: 'Alto' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Econômico, boa performance', cost: 'Muito Baixo' }
];

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    prompt: '',
    openai_model: 'gpt-4o-mini',
    openai_api_key: '',
    is_followup_enabled: true,
    followup_intervals: [24, 48, 72],
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    timezone: 'America/Sao_Paulo',
    max_followup_attempts: 3,
    whatsapp_rate_limit: 60,
    max_retry_delay: 60
  });

  const [status, setStatus] = useState<SettingsStatus>({
    openai_key_valid: false,
    followup_active_count: 0,
    last_test_result: null
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStatus();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/settings/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const validateOpenAIKey = async (key: string) => {
    if (!key || key.length < 10) {
      return false;
    }

    setValidatingKey(true);
    try {
      const response = await fetch('/api/settings/validate-openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      });

      const result = await response.json();
      return result.valid;
    } catch (error) {
      return false;
    } finally {
      setValidatingKey(false);
    }
  };

  const canSave = () => {
    return settings.openai_api_key && 
           settings.openai_api_key.length > 10 && 
           settings.prompt.length > 10 &&
           status.openai_key_valid;
  };

  const saveSettings = async () => {
    if (!canSave()) {
      toast({
        title: "Erro de Validação",
        description: "Chave OpenAI inválida ou prompt muito curto",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso"
        });
        await loadStatus(); // Recarregar status
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao salvar');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testPrompt = async () => {
    if (!canSave()) {
      toast({
        title: "Erro",
        description: "Configure uma chave OpenAI válida primeiro",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/settings/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: settings.prompt,
          model: settings.openai_model,
          api_key: settings.openai_api_key
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus(prev => ({ ...prev, last_test_result: result.response }));
        toast({
          title: "Teste realizado com sucesso",
          description: `Resposta: ${result.response.substring(0, 100)}...`
        });
      } else {
        throw new Error(result.error || 'Erro no teste');
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : "Erro ao testar prompt",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const updateSetting = async (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Validar chave OpenAI automaticamente
    if (key === 'openai_api_key') {
      const isValid = await validateOpenAIKey(value);
      setStatus(prev => ({ ...prev, openai_key_valid: isValid }));
    }
  };

  const getKeyStatus = () => {
    if (!settings.openai_api_key) {
      return { icon: AlertTriangle, color: 'text-red-500', text: 'Não configurada' };
    }
    if (validatingKey) {
      return { icon: Loader2, color: 'text-yellow-500', text: 'Validando...' };
    }
    if (status.openai_key_valid) {
      return { icon: CheckCircle, color: 'text-green-500', text: 'Válida' };
    }
    return { icon: AlertTriangle, color: 'text-red-500', text: 'Inválida' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const keyStatus = getKeyStatus();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Configure o comportamento do sistema de automação
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={status.openai_key_valid ? "default" : "destructive"}>
            <keyStatus.icon className={`h-4 w-4 mr-1 ${keyStatus.color}`} />
            OpenAI: {keyStatus.text}
          </Badge>
          <Button onClick={saveSettings} disabled={saving || !canSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>

      {!canSave() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Configure uma chave OpenAI válida e um prompt (mínimo 10 caracteres) para salvar as configurações.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA & Conversação
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Follow-up
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de IA</CardTitle>
              <CardDescription>
                Configure o comportamento da inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">Chave da API OpenAI</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="sk-..."
                      value={settings.openai_api_key}
                      onChange={(e) => updateSetting('openai_api_key', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <keyStatus.icon className={`h-4 w-4 ${keyStatus.color}`} />
                    <span className={`text-sm ${keyStatus.color}`}>{keyStatus.text}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sua chave da API OpenAI. Será armazenada de forma segura e criptografada.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo OpenAI</Label>
                <Select 
                  value={settings.openai_model} 
                  onValueChange={(value) => updateSetting('openai_model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENAI_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{model.label}</div>
                            <div className="text-sm text-muted-foreground">{model.description}</div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            Custo: {model.cost}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">Prompt do Sistema</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testPrompt}
                    disabled={testing || !canSave()}
                  >
                    {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                    Testar Prompt
                  </Button>
                </div>
                <Textarea
                  id="prompt"
                  placeholder="Digite o prompt que a IA deve seguir..."
                  value={settings.prompt}
                  onChange={(e) => updateSetting('prompt', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Este prompt define como a IA se comporta nas conversas.</span>
                  <span>{settings.prompt.length} caracteres</span>
                </div>
              </div>

              {status.last_test_result && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Último teste:</strong> {status.last_test_result.substring(0, 200)}...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Follow-up</CardTitle>
              <CardDescription>
                Configure o comportamento dos follow-ups automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Follow-up Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar ou desativar follow-ups automáticos globalmente
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.is_followup_enabled}
                    onCheckedChange={(checked: boolean) => updateSetting('is_followup_enabled', checked)}
                  />
                  <Badge variant={settings.is_followup_enabled ? "default" : "secondary"}>
                    {settings.is_followup_enabled ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              {status.followup_active_count > 0 && (
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{status.followup_active_count}</strong> follow-ups ativos no momento.
                  </AlertDescription>
                </Alert>
              )}

              {settings.is_followup_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Intervalos de Follow-up (horas)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {settings.followup_intervals.map((interval, index) => (
                        <div key={index} className="space-y-1">
                          <Input
                            type="number"
                            min="1"
                            max="168"
                            value={interval}
                            onChange={(e) => {
                              const newIntervals = [...settings.followup_intervals];
                              newIntervals[index] = parseInt(e.target.value) || 0;
                              updateSetting('followup_intervals', newIntervals);
                            }}
                            placeholder={`${index + 1}º follow-up`}
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            {index + 1}º follow-up
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Defina os intervalos em horas para cada follow-up (ex: 24, 48, 72)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_attempts">Máximo de Tentativas</Label>
                    <Input
                      id="max_attempts"
                      type="number"
                      min="1"
                      max="5"
                      value={settings.max_followup_attempts}
                      onChange={(e) => updateSetting('max_followup_attempts', parseInt(e.target.value) || 3)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Número máximo de follow-ups antes de descartar o lead
                    </p>
                  </div>
                </>
              )}

              {!settings.is_followup_enabled && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Follow-ups automáticos estão desativados. Nenhum follow-up será enviado automaticamente.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Horário</CardTitle>
              <CardDescription>
                Configure horários comerciais e fuso horário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(value) => updateSetting('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fuso horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_start">Início do Expediente</Label>
                  <Input
                    id="business_start"
                    type="time"
                    value={settings.business_hours_start}
                    onChange={(e) => updateSetting('business_hours_start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_end">Fim do Expediente</Label>
                  <Input
                    id="business_end"
                    type="time"
                    value={settings.business_hours_end}
                    onChange={(e) => updateSetting('business_hours_end', e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Follow-ups e mensagens automáticas respeitarão estes horários comerciais.
                  Mensagens fora do horário serão agendadas para o próximo horário comercial.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure limites de taxa e segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rate_limit">Limite de Mensagens WhatsApp (por minuto)</Label>
                <Input
                  id="rate_limit"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.whatsapp_rate_limit}
                  onChange={(e) => updateSetting('whatsapp_rate_limit', parseInt(e.target.value) || 60)}
                />
                <p className="text-sm text-muted-foreground">
                  Limite de mensagens por minuto para evitar bloqueios do WhatsApp
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_retry_delay">Delay Máximo de Retry (segundos)</Label>
                <Input
                  id="max_retry_delay"
                  type="number"
                  min="10"
                  max="300"
                  value={settings.max_retry_delay}
                  onChange={(e) => updateSetting('max_retry_delay', parseInt(e.target.value) || 60)}
                />
                <p className="text-sm text-muted-foreground">
                  Tempo máximo de espera entre tentativas de retry
                </p>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  O sistema automaticamente respeita o limite de 1 mensagem por segundo do WhatsApp.
                  Estes limites adicionais oferecem controle extra sobre o volume de mensagens.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
