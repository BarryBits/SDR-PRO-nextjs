"use client";

import { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Phone, Download, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversation, type Message } from "@/hooks/useConversations";
import { toast } from "sonner"; // Importação adicionada

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConversationModalProps {
  leadId: string | null;
  leadName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationModal({ leadId, leadName, isOpen, onClose }: ConversationModalProps) {
  const { conversation, loading, error, refetch } = useConversation(leadId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && conversation && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => viewport.scrollTop = viewport.scrollHeight, 100);
      }
    }
  }, [isOpen, conversation]);

  const exportConversation = () => {
    if (!conversation) return;
    const content = conversation.messages.map(msg =>
      `[${new Date(msg.created_at).toLocaleString('pt-BR')}] ${msg.direction === 'inbound' ? conversation.lead_name : 'Assistente'}: ${msg.content}`
    ).join('\n\n');
    const blob = new Blob([`Histórico de Conversa com ${conversation.lead_name}\n\n${content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa_${conversation.lead_name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Conversa exportada com sucesso!"); // Feedback com toast
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6 p-4">
          <div className="flex justify-start gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-16 w-3/4" /></div>
          <div className="flex justify-end gap-3"><Skeleton className="h-20 w-1/2" /><Skeleton className="h-10 w-10 rounded-full" /></div>
          <div className="flex justify-start gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-12 w-2/4" /></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive p-8">
          <AlertCircle className="h-12 w-12" />
          <AlertTitle className="text-lg font-semibold">Erro ao carregar conversa</AlertTitle>
          <AlertDescription className="text-center">{error}</AlertDescription>
          <Button variant="outline" onClick={refetch}><Loader2 className="mr-2 h-4 w-4" /> Tentar novamente</Button>
        </div>
      );
    }

    if (!conversation || conversation.messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
          <MessageSquare className="h-12 w-12 opacity-50" />
          <p className="mt-4">Nenhuma mensagem encontrada</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
        <div className="space-y-6 pb-4">
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} leadName={conversation.lead_name} />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col border-white/10 bg-black/50 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="flex-shrink-0 border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="font-heading">Conversa com {conversation?.lead_name || leadName}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{conversation?.lead_phone}</span>
                  {conversation?.lead_status && <Badge variant="secondary">{conversation.lead_status}</Badge>}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 py-4">{renderContent()}</div>
        {conversation && conversation.messages.length > 0 && (
          <div className="flex-shrink-0 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {conversation.total_messages} mensagens. Última: {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ptBR })}
            </div>
            <Button variant="outline" size="sm" onClick={exportConversation}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MessageBubble({ message, leadName }: { message: Message, leadName: string }) {
  const isInbound = message.direction === 'inbound';
  return (
    <div className={cn("flex items-end gap-3", isInbound ? "justify-start" : "justify-end")}>
      {isInbound && (
        <Avatar className="h-8 w-8 self-start"><AvatarFallback>{leadName?.[0]}</AvatarFallback></Avatar>
      )}
      <div className={cn("max-w-[80%] rounded-lg px-4 py-2 text-sm", isInbound ? "bg-secondary rounded-bl-none" : "bg-primary text-primary-foreground rounded-br-none")}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className="text-xs opacity-70 mt-2 text-right">
          {format(new Date(message.created_at), "HH:mm")}
        </p>
      </div>
      {!isInbound && (
        <Avatar className="h-8 w-8 self-start"><AvatarFallback>IA</AvatarFallback></Avatar>
      )}
    </div>
  );
}