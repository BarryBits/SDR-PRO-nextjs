// Caminho: src/components/dashboard/FollowUpModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Send, Users, FileText } from 'lucide-react';
import { type ActionableInsight, startFollowUpCampaign } from '@/actions/dashboardActions';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: ActionableInsight | null;
}

/**
 * Este componente é o modal de controle que permite ao usuário
 * escolher um template específico da Meta e disparar uma campanha de
 * follow-up para os leads identificados em um "insight".
 */
export function FollowUpModal({ isOpen, onClose, insight }: FollowUpModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para resetar o nome do template sempre que o modal for aberto com um novo insight.
  // Isso garante que o campo esteja sempre limpo para uma nova ação.
  useEffect(() => {
    if (insight) {
      setTemplateName(''); // Começa em branco para o usuário preencher.
    }
  }, [insight]);

  const handleSubmit = async () => {
    if (!insight) {
      toast.error("Erro Crítico: Insight não encontrado para processar a campanha.");
      return;
    }

    if (!templateName.trim()) {
      toast.error("O nome do template da Meta é obrigatório.", {
        description: "Por favor, insira o nome exato do template que deseja enviar.",
      });
      return;
    }

    setIsSubmitting(true);

    // Chama a Server Action, passando a lista de IDs e o nome do template escolhido.
    const promise = startFollowUpCampaign(insight.leadIds, templateName.trim());

    toast.promise(promise, {
      loading: `Disparando campanha para ${insight.leadCount} leads...`,
      success: (result) => {
        if (result.error) {
          // Se a Server Action retornar um erro, ele será lançado e capturado aqui.
          throw new Error(result.error);
        }
        onClose(); // Fecha o modal em caso de sucesso.
        return "Campanha de follow-up enviada para a fila com sucesso!";
      },
      error: (err) => `Falha ao disparar campanha: ${err.message}`,
      finally: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Se não houver insight, o modal não renderiza nada para evitar erros.
  if (!insight) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">Disparar Campanha de Follow-up</DialogTitle>
          <DialogDescription>
            Você está prestes a enviar uma nova mensagem para os leads que não responderam.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Alert variant="default" className="border-primary/20 bg-primary/5">
            <Users className="h-4 w-4" />
            <AlertTitle className="font-semibold">{insight.campaignName}</AlertTitle>
            <AlertDescription>
              A mensagem será enviada para <strong>{insight.leadCount} leads</strong> selecionados.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="template-name" className="font-semibold">
              Nome do Template da Meta <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                id="template-name"
                placeholder="Ex: reativacao_semana_1"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="pl-10"
                />
            </div>
            <p className="text-xs text-muted-foreground">
              Insira o nome exato do template de mensagem aprovado na sua conta da Meta.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !templateName.trim()}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Disparar para {insight.leadCount} Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
