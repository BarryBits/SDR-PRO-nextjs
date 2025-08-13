"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, Clock, Send, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  getColdLeadsByCampaign, 
  triggerReactivationCampaign, 
  scheduleFollowUpCampaign,
  getFollowUpStats 
} from "@/actions/campaignFollowUpActions";
import { type Campaign } from "@/lib/types";

interface FollowUpCampaignModalProps {
  campaign: Campaign;
  trigger: React.ReactNode;
}

interface ColdLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  last_message_at?: string;
  days_since_last_message: number;
}

export function FollowUpCampaignModal({ campaign, trigger }: FollowUpCampaignModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coldLeads, setColdLeads] = useState<ColdLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [daysSinceLastMessage, setDaysSinceLastMessage] = useState(3);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const loadColdLeads = async () => {
    setLoading(true);
    const result = await getColdLeadsByCampaign(campaign.id, daysSinceLastMessage);
    if (result.error) {
      toast.error(`Erro ao carregar leads frios: ${result.error}`);
      setColdLeads([]);
    } else {
      setColdLeads(result.data || []);
      setSelectedLeads(result.data?.map(lead => lead.id) || []);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const result = await getFollowUpStats(campaign.id);
    if (!result.error) {
      setStats(result.data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadColdLeads();
      loadStats();
      setMessageTemplate(`Olá! Notei que não conversamos há alguns dias. Como posso ajudá-lo(a) hoje?`);
    }
  }, [isOpen, daysSinceLastMessage]);

  const handleLeadToggle = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    setSelectedLeads(coldLeads.map(lead => lead.id));
  };

  const handleDeselectAll = () => {
    setSelectedLeads([]);
  };

  const handleSubmit = async () => {
    if (selectedLeads.length === 0) {
      toast.error("Selecione pelo menos um lead para enviar a campanha.");
      return;
    }

    if (!messageTemplate.trim()) {
      toast.error("Digite uma mensagem para enviar aos leads.");
      return;
    }

    setSubmitting(true);

    try {
      if (isScheduled) {
        if (!scheduledDate) {
          toast.error("Selecione uma data para agendar a campanha.");
          return;
        }

        const result = await scheduleFollowUpCampaign(
          campaign.id,
          scheduledDate,
          messageTemplate
        );

        if (result.success) {
          toast.success(`Campanha agendada para ${new Date(scheduledDate).toLocaleString('pt-BR')}!`);
          setIsOpen(false);
        } else {
          toast.error(`Erro ao agendar campanha: ${result.error}`);
        }
      } else {
        const result = await triggerReactivationCampaign(
          campaign.id,
          selectedLeads,
          messageTemplate
        );

        if (result.success) {
          toast.success(`Campanha de reaquecimento enviada para ${result.triggered} leads!`);
          setIsOpen(false);
        } else {
          toast.error(`Erro ao enviar campanha: ${result.error}`);
        }
      }
    } catch (error) {
      toast.error("Erro inesperado ao processar a campanha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campanha de Follow-up - {campaign.name}</DialogTitle>
          <DialogDescription>
            Reative leads que não responderam recentemente com uma mensagem personalizada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalLeads}</div>
                  <div className="text-sm text-muted-foreground">Total de Leads</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.coldLeads}</div>
                  <div className="text-sm text-muted-foreground">Leads Frios</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.reactivationSent}</div>
                  <div className="text-sm text-muted-foreground">Reativação Enviada</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.responded}</div>
                  <div className="text-sm text-muted-foreground">Responderam</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="daysSince">Dias desde última mensagem</Label>
              <Input
                id="daysSince"
                type="number"
                min="1"
                max="30"
                value={daysSinceLastMessage}
                onChange={(e) => setDaysSinceLastMessage(parseInt(e.target.value) || 3)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="scheduled"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
              <Label htmlFor="scheduled">Agendar para depois</Label>
            </div>
          </div>

          {isScheduled && (
            <div>
              <Label htmlFor="scheduledDate">Data e hora para envio</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          {/* Mensagem Template */}
          <div>
            <Label htmlFor="messageTemplate">Mensagem de Reaquecimento</Label>
            <Textarea
              id="messageTemplate"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Digite a mensagem que será enviada aos leads..."
              rows={4}
            />
          </div>

          {/* Lista de Leads Frios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Leads Frios Encontrados ({coldLeads.length})</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Selecionar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Desmarcar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadColdLeads} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : coldLeads.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum lead frio encontrado para esta campanha nos últimos {daysSinceLastMessage} dias.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {coldLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLeads.includes(lead.id) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleLeadToggle(lead.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleLeadToggle(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.phone}</div>
                          {lead.email && (
                            <div className="text-sm text-muted-foreground">{lead.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {lead.days_since_last_message} dias
                        </Badge>
                        {lead.last_message_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Última: {new Date(lead.last_message_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || selectedLeads.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isScheduled ? (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Campanha
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Agora ({selectedLeads.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

