// Caminho: src/components/settings/SystemPromptsManager.tsx
"use client";

/**
 * @file src/components/settings/SystemPromptsManager.tsx
 * @description Gerenciador de Prompts de IA, agora integrado à página de Configurações.
 *
 * @version 2.1.0 (Correção de Imports)
 * @author Gemini Dev Lead & [Seu Nome]
 *
 * @fixes
 * - Adicionadas as importações faltantes de `AlertDialogTrigger` e `buttonVariants`.
 */

import React,{ useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// --- Server Actions e Tipos ---
import { 
  getSystemPrompts, 
  createSystemPrompt, 
  updateSystemPrompt, 
  deleteSystemPrompt,
  setDefaultSystemPrompt,
} from "@/actions/systemPromptActions";
import { 
  type SystemPrompt,
  type SystemPromptCreate,
  type SystemPromptUpdate 
} from "@/lib/types";

// --- Componentes da UI ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button"; // <-- CORREÇÃO APLICADA AQUI
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // <-- CORREÇÃO APLICADA AQUI
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Ícones ---
import { PlusCircle, Edit, Trash2, Copy, Brain, Loader2, AlertCircle, Star, StarOff } from "lucide-react";

// --- Sub-componente de Formulário (Boa prática para manter o código organizado) ---
interface SystemPromptFormProps {
  initialData?: SystemPrompt;
  onSubmit: (data: SystemPromptCreate | SystemPromptUpdate) => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
}

function SystemPromptForm({ initialData, onSubmit, isSubmitting, onClose }: SystemPromptFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    prompt_content: initialData?.prompt_content || "",
    is_active: initialData?.is_active ?? true,
    is_default: initialData?.is_default ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Prompt</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Input id="description" value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prompt_content">Conteúdo do Prompt</Label>
        <Textarea id="prompt_content" value={formData.prompt_content} onChange={(e) => setFormData(prev => ({ ...prev, prompt_content: e.target.value }))} rows={8} required />
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} />
        <Label htmlFor="is_active" className="font-normal">Prompt ativo</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Prompt
        </Button>
      </DialogFooter>
    </form>
  );
}

// --- Componente Principal ---
export function SystemPromptsManager() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSystemPrompts();
      if (result.error) throw new Error(result.error);
      setPrompts(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleFormSubmit = useCallback(async (data: SystemPromptCreate | SystemPromptUpdate) => {
    setIsSubmitting(true);
    const actionPromise = editingPrompt
      ? updateSystemPrompt(editingPrompt.id, data as SystemPromptUpdate)
      : createSystemPrompt(data as SystemPromptCreate);

    toast.promise(actionPromise, {
      loading: "Salvando prompt...",
      success: (result) => {
        if (result.error) throw new Error(result.error);
        fetchPrompts();
        setIsModalOpen(false);
        setEditingPrompt(null);
        return `Prompt salvo com sucesso!`;
      },
      error: (err) => `Erro ao salvar: ${err.message}`,
      finally: () => setIsSubmitting(false),
    });
  }, [editingPrompt, fetchPrompts]);

  const handleDelete = useCallback((prompt: SystemPrompt) => {
    const promise = deleteSystemPrompt(prompt.id);
    toast.promise(promise, {
      loading: `Excluindo prompt "${prompt.name}"...`,
      success: (result) => {
        if (result.error) throw new Error(result.error);
        fetchPrompts();
        return `Prompt excluído!`;
      },
      error: (err) => `Erro ao excluir: ${err.message}`,
    });
  }, [fetchPrompts]);

  const handleSetDefault = useCallback((prompt: SystemPrompt) => {
    const promise = setDefaultSystemPrompt(prompt.id);
    toast.promise(promise, {
      loading: `Definindo "${prompt.name}" como padrão...`,
      success: (result) => {
        if (result.error) throw new Error(result.error);
        fetchPrompts();
        return `Prompt padrão atualizado!`;
      },
      error: (err) => `Erro ao definir como padrão: ${err.message}`,
    });
  }, [fetchPrompts]);

  const handleCopyPrompt = (promptContent: string) => {
    navigator.clipboard.writeText(promptContent);
    toast.success("Conteúdo do prompt copiado!");
  };

  const openCreateModal = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciador de Prompts</CardTitle>
          <CardDescription>Crie e gerencie as personalidades da sua IA para usar nas campanhas.</CardDescription>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateModal}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingPrompt ? "Editar Prompt" : "Criar Novo Prompt de Sistema"}</DialogTitle>
              <DialogDescription>{editingPrompt ? "Modifique os detalhes do prompt abaixo." : "Crie uma nova personalidade para a IA."}</DialogDescription>
            </DialogHeader>
            <SystemPromptForm 
              initialData={editingPrompt || undefined} 
              onSubmit={handleFormSubmit} 
              isSubmitting={isSubmitting}
              onClose={() => setIsModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Prompts</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && (
          <div className="grid gap-4">
            {prompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Brain className="h-8 w-8 mb-2" />
                <p className="font-medium">Nenhum prompt de sistema encontrado.</p>
                <p className="text-sm">Clique em "Novo Prompt" para criar o seu primeiro.</p>
              </div>
            ) : (
              prompts.map((prompt) => (
                <Card key={prompt.id} className={prompt.is_default ? "border-primary shadow-md" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{prompt.name}</CardTitle>
                          {prompt.is_default && (<Badge><Star className="h-3 w-3 mr-1" />Padrão</Badge>)}
                          {!prompt.is_active && (<Badge variant="secondary">Inativo</Badge>)}
                        </div>
                        {prompt.description && (<CardDescription>{prompt.description}</CardDescription>)}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <TooltipProvider delayDuration={0}>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => handleCopyPrompt(prompt.prompt_content)}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Copiar conteúdo</p></TooltipContent></Tooltip>
                          {!prompt.is_default && (<Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => handleSetDefault(prompt)}><StarOff className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Definir como padrão</p></TooltipContent></Tooltip>)}
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => openEditModal(prompt)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar prompt</p></TooltipContent></Tooltip>
                          {!prompt.is_default && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir o prompt "{prompt.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(prompt)} className={buttonVariants({ variant: "destructive" })}>Confirmar Exclusão</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">{prompt.prompt_content.length > 250 ? `${prompt.prompt_content.substring(0, 250)}...` : prompt.prompt_content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}