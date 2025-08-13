// src/components/calendar/calendar-management.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, Clock, User, Settings, Plus, Trash2, 
  CheckCircle, XCircle, AlertCircle, ExternalLink,
  Mail, Globe, Loader2
} from 'lucide-react';

// Interfaces para tipagem dos dados
interface CalendarAccount {
  id: string;
  consultant_id: string;
  provider: 'google' | 'microsoft';
  account_email: string;
  consultant_name: string;
  is_active: boolean;
  created_at: string;
}

interface Consultant {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

interface CalendarSettings {
  auto_scheduling_enabled: boolean;
  followup_enabled: boolean;
  reactivation_enabled: boolean;
  followup_templates: Record<string, string>;
  reactivation_templates: string[];
  meeting_confirmation_templates: string[];
  meeting_reminder_templates: Record<string, string[]>;
}

export default function CalendarManagement() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({
    auto_scheduling_enabled: true,
    followup_enabled: true,
    reactivation_enabled: true,
    followup_templates: {
      "1": "Olá {name}! Vi que você demonstrou interesse em nossos serviços. Gostaria de esclarecer alguma dúvida?",
      "2": "Oi {name}! Ainda estou aqui para ajudar com qualquer questão sobre nossos serviços. Posso ajudar?",
      "3": "Olá {name}! Esta é minha última tentativa de contato. Se tiver interesse, estarei disponível. Obrigado!"
    },
    reactivation_templates: [
      "Oi {name}! Como posso ajudar você hoje?",
      "Olá! Tem alguma dúvida que eu possa esclarecer?",
      "Oi! Gostaria de continuar nossa conversa?"
    ],
    meeting_confirmation_templates: [
      "🎉 Reunião agendada com sucesso!\n\n📅 Data: {date}\n🕐 Horário: {time}\n👤 Consultor: {consultant}\n\nVocê receberá lembretes antes da reunião. Até lá!"
    ],
    meeting_reminder_templates: {
      "24h": ["🔔 Lembrete: Você tem uma reunião agendada para amanhã às {time} com {consultant}. Nos vemos lá!"],
      "1h": ["🚨 Sua reunião com {consultant} é em 1 hora! Já está se preparando?"]
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar contas de calendário
      const accountsResponse = await fetch('/api/v1/calendar/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData);
      }

      // Buscar consultores
      const consultantsResponse = await fetch('/api/v1/consultants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (consultantsResponse.ok) {
        const consultantsData = await consultantsResponse.json();
        setConsultants(consultantsData);
      }

      // Buscar configurações
      const settingsResponse = await fetch('/api/v1/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.settings_data) {
          setSettings(prev => ({ ...prev, ...settingsData.settings_data }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async (consultantId: string, provider: 'google' | 'microsoft') => {
    try {
      const response = await fetch(`/api/v1/calendar/${provider}/auth?consultant_id=${consultantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirecionar para OAuth
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Erro ao conectar calendário:', error);
    }
  };

  const disconnectCalendar = async (accountId: string) => {
    try {
      const response = await fetch(`/api/v1/calendar/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      }
    } catch (error) {
      console.error('Erro ao desconectar calendário:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings_data: settings })
      });
      
      if (response.ok) {
        // Mostrar sucesso
        console.log('Configurações salvas com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateFollowupTemplate = (followupNumber: string, template: string) => {
    setSettings(prev => ({
      ...prev,
      followup_templates: {
        ...prev.followup_templates,
        [followupNumber]: template
      }
    }));
  };

  const addReactivationTemplate = () => {
    setSettings(prev => ({
      ...prev,
      reactivation_templates: [...prev.reactivation_templates, ""]
    }));
  };

  const updateReactivationTemplate = (index: number, template: string) => {
    setSettings(prev => ({
      ...prev,
      reactivation_templates: prev.reactivation_templates.map((t, i) => i === index ? template : t)
    }));
  };

  const removeReactivationTemplate = (index: number) => {
    setSettings(prev => ({
      ...prev,
      reactivation_templates: prev.reactivation_templates.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Calendários</h2>
          <p className="text-muted-foreground">
            Configure integrações de calendário e automações de agendamento
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Contas de Calendário</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {/* Contas conectadas */}
          <Card>
            <CardHeader>
              <CardTitle>Contas Conectadas</CardTitle>
              <CardDescription>
                Gerencie as integrações de calendário dos seus consultores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma conta de calendário conectada. Conecte pelo menos uma conta para habilitar agendamento automático.
                    </AlertDescription>
                  </Alert>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-muted">
                          {account.provider === 'google' ? (
                            <Mail className="h-5 w-5" />
                          ) : (
                            <Globe className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{account.consultant_name}</div>
                          <div className="text-sm text-muted-foreground">{account.account_email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={account.provider === 'google' ? 'default' : 'secondary'}>
                              {account.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}
                            </Badge>
                            <Badge variant={account.is_active ? 'default' : 'destructive'}>
                              {account.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectCalendar(account.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conectar novas contas */}
          <Card>
            <CardHeader>
              <CardTitle>Conectar Nova Conta</CardTitle>
              <CardDescription>
                Conecte calendários dos consultores para habilitar agendamento automático
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultants.filter(c => c.is_active).map((consultant) => {
                  const hasGoogleAccount = accounts.some(acc => 
                    acc.consultant_id === consultant.id && acc.provider === 'google' && acc.is_active
                  );
                  const hasMicrosoftAccount = accounts.some(acc => 
                    acc.consultant_id === consultant.id && acc.provider === 'microsoft' && acc.is_active
                  );

                  return (
                    <div key={consultant.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{consultant.name}</div>
                        <div className="text-sm text-muted-foreground">{consultant.email}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant={hasGoogleAccount ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => connectCalendar(consultant.id, 'google')}
                          disabled={hasGoogleAccount}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {hasGoogleAccount ? 'Google Conectado' : 'Conectar Google'}
                        </Button>
                        <Button
                          variant={hasMicrosoftAccount ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => connectCalendar(consultant.id, 'microsoft')}
                          disabled={hasMicrosoftAccount}
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          {hasMicrosoftAccount ? 'Microsoft Conectado' : 'Conectar Microsoft'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Automação</CardTitle>
              <CardDescription>
                Configure o comportamento automático do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Agendamento Automático</Label>
                  <div className="text-sm text-muted-foreground">
                    Agendar reuniões automaticamente para leads qualificados
                  </div>
                </div>
                <Switch
                  checked={settings.auto_scheduling_enabled}
                  onCheckedChange={(checked: boolean) => 
                    setSettings(prev => ({ ...prev, auto_scheduling_enabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Follow-ups Automáticos</Label>
                  <div className="text-sm text-muted-foreground">
                    Enviar follow-ups automáticos para leads que não responderam
                  </div>
                </div>
                <Switch
                  checked={settings.followup_enabled}
                  onCheckedChange={(checked: boolean) => 
                    setSettings(prev => ({ ...prev, followup_enabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Reativação de Conversas</Label>
                  <div className="text-sm text-muted-foreground">
                    Reativar conversas que pararam dentro da janela de 24h
                  </div>
                </div>
                <Switch
                  checked={settings.reactivation_enabled}
                  onCheckedChange={(checked: boolean) => 
                    setSettings(prev => ({ ...prev, reactivation_enabled: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* Templates de Follow-up */}
          <Card>
            <CardHeader>
              <CardTitle>Templates de Follow-up</CardTitle>
              <CardDescription>
                Configure as mensagens de follow-up automático
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.followup_templates).map(([number, template]) => (
                <div key={number} className="space-y-2">
                  <Label>Follow-up {number} (após {number === '1' ? '24h' : number === '2' ? '48h' : '72h'})</Label>
                  <Textarea
                    value={template}
                    onChange={(e) => updateFollowupTemplate(number, e.target.value)}
                    placeholder="Digite o template do follow-up..."
                    className="min-h-[80px]"
                  />
                  <div className="text-xs text-muted-foreground">
                    Use {'{name}'} para incluir o nome do lead
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Templates de Reativação */}
          <Card>
            <CardHeader>
              <CardTitle>Templates de Reativação</CardTitle>
              <CardDescription>
                Configure as mensagens de reativação de conversas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.reactivation_templates.map((template, index) => (
                <div key={index} className="flex space-x-2">
                  <Textarea
                    value={template}
                    onChange={(e) => updateReactivationTemplate(index, e.target.value)}
                    placeholder="Digite o template de reativação..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeReactivationTemplate(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addReactivationTemplate}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
