// Caminho: src/app/(protected)/(shell)/campaigns/page.tsx
"use client";

/**
 * @file src/app/(protected)/(shell)/campaigns/page.tsx
 * @description Página de gerenciamento de Campanhas, com fluxo de criação multi-etapas e monitoramento.
 *
 * @version 5.1.0 (Correção do bug de animação no status de processamento)
 * @author Gemini Dev Lead & Lucas Trombeli
 *
 * @features
 * - Conexão do modal com as Server Actions reais: `validateCampaignCSV` e `createCampaignWithLeads`.
 * - Feedback de usuário aprimorado com `toast.promise` para operações assíncronas.
 * - Fluxo de criação de campanha 100% funcional.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

// --- Server Actions ---
import { 
  getCampaigns, 
  deleteCampaign,
  updateCampaign,
  validateCampaignCSV,
  createCampaignWithLeads,
  runCampaign
} from "@/actions/campaignActions";
import { getSystemPrompts } from "@/actions/systemPromptActions";
import { type Campaign, type SystemPrompt } from "@/lib/types";

// --- Componentes da UI ---
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { StatsGrid } from "@/components/data/stats-grid";
import { MetricCard } from "@/components/data/metrics-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Ícones ---
import { PlusCircle, AlertCircle, RefreshCw, Loader2, Edit, Trash2, Play, Bot, Upload, Download, Send, Clock, Target, CheckCircle, Users, XCircle } from "lucide-react";

// --- Tipos e Interfaces ---
type ModalStep = 'form' | 'validation_summary' | 'loading';
interface CampaignFormData { name: string; template_name: string; system_prompt_id: string; csv_file: File | null; }
interface ValidationResult { total_rows: number; valid_leads: number; duplicate_phones: number; invalid_phones: number; }

// ============================================================================
// COMPONENTE: MODAL DE NOVA CAMPANHA (COM LÓGICA REAL)
// ============================================================================
function NewCampaignModal({ isOpen, onClose, onSuccess, prompts }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; prompts: SystemPrompt[]; }) {
  const [step, setStep] = useState<ModalStep>('form');
  const [formData, setFormData] = useState<CampaignFormData>({ name: "", template_name: "", system_prompt_id: "", csv_file: null, });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedPromptContent, setSelectedPromptContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultPrompt = prompts.find(p => p.is_default);
    if (defaultPrompt && isOpen) {
      setFormData(prev => ({ ...prev, system_prompt_id: defaultPrompt.id }));
    }
  }, [prompts, isOpen]);

  useEffect(() => {
    const selected = prompts.find(p => p.id === formData.system_prompt_id);
    setSelectedPromptContent(selected?.prompt_content || "Selecione um prompt para ver a prévia.");
  }, [formData.system_prompt_id, prompts]);

  const resetAndClose = () => {
    setStep('form');
    setFormData({ name: "", template_name: "", system_prompt_id: "", csv_file: null });
    setValidationResult(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande", { description: "O limite é de 5MB." }); return; }
    if (!file.name.toLowerCase().endsWith(".csv")) { toast.error("Formato de arquivo inválido", { description: "Por favor, envie um arquivo no formato .csv." }); return; }
    setFormData((prev) => ({ ...prev, csv_file: file }));
  };
  
  const handleValidate = async () => {
    if (!formData.name || !formData.template_name || !formData.csv_file) {
      toast.error("Preenchimento obrigatório", { description: "Nome da campanha, nome do template e arquivo CSV são necessários." });
      return;
    }
    setStep('loading');
    
    const payload = new FormData();
    payload.append('csv_file', formData.csv_file);
    
    const result = await validateCampaignCSV(payload);

    if (result.success && result.data) {
      setValidationResult(result.data);
      setStep('validation_summary');
    } else {
      toast.error("Erro na validação do CSV", { description: result.error });
      setStep('form');
    }
  };
  
  const handleCreateCampaign = async () => {
    if (!formData.csv_file || !validationResult || validationResult.valid_leads === 0) {
      toast.error("Não é possível criar uma campanha sem leads válidos.");
      return;
    }
    setStep('loading');

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('template_name', formData.template_name);
    payload.append('system_prompt_id', formData.system_prompt_id);
    payload.append('csv_file', formData.csv_file);

    const promise = createCampaignWithLeads(payload);

    toast.promise(promise, {
      loading: "Criando campanha e importando leads...",
      success: (result) => {
        if (result.error) throw new Error(result.error);
        onSuccess();
        resetAndClose();
        return `Campanha "${result.data?.name}" criada com ${result.data?.leads_count} leads!`;
      },
      error: (err) => `Falha ao criar campanha: ${err.message}`,
      finally: () => setStep('form'),
    });
  };

  const downloadCSVTemplate = () => {
    const csvContent = "telefone,nome,email,empresa,cidade\n" + "5511999998888,João da Silva,joao@email.com,Empresa Exemplo,São Paulo\n" + "5521988887777,Maria Oliveira,maria@email.com,Companhia Teste,Rio de Janeiro";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_leads_sdr_pro.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle className="text-xl font-heading font-bold">{step === 'form' ? "Criar Nova Campanha" : "Resumo da Validação da Lista"}</DialogTitle><DialogDescription>{step === 'form' ? "Siga as etapas para configurar e iniciar sua nova campanha." : "Revise os dados do seu arquivo antes de criar a campanha."}</DialogDescription></DialogHeader>
        {step === 'loading' && <div className="flex flex-col items-center justify-center space-y-4 py-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-muted-foreground">Processando, por favor aguarde...</p></div>}
        {step === 'form' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4"><div className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Nome da Campanha *</Label><Input id="name" placeholder="Ex: Prospecção Leads de Agosto" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} /></div><div className="space-y-2"><Label htmlFor="template_name">Nome do Template Meta *</Label><Input id="template_name" placeholder="Ex: followup_inicial_vendas" value={formData.template_name} onChange={(e) => setFormData(p => ({ ...p, template_name: e.target.value }))} /></div><div className="space-y-2"><Label htmlFor="system_prompt_id">Personalidade da IA (Prompt) *</Label><Select value={formData.system_prompt_id} onValueChange={(value: string) => setFormData(p => ({ ...p, system_prompt_id: value }))}><SelectTrigger><SelectValue placeholder="Selecione um prompt" /></SelectTrigger><SelectContent>{prompts.map((prompt) => (<SelectItem key={prompt.id} value={prompt.id}>{prompt.name}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label>Pré-visualização do Prompt</Label><div className="text-xs p-3 h-24 bg-muted/50 rounded-md overflow-y-auto text-muted-foreground whitespace-pre-wrap font-mono">{selectedPromptContent.substring(0, 300) + (selectedPromptContent.length > 300 ? '...' : '')}</div></div></div><div className="space-y-4"><div className="space-y-2"><Label>Lista de Leads (Arquivo .csv) *</Label><div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"><Upload className="mx-auto h-8 w-8 text-muted-foreground" /><div className="mt-3"><Label htmlFor="csv-upload" className="cursor-pointer font-medium text-primary hover:text-primary/80">Clique para fazer o upload</Label><Input ref={fileInputRef} id="csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground mt-1">A coluna "telefone" é obrigatória.</p></div></div>{formData.csv_file && <Alert className="mt-3 border-green-200 bg-green-50 text-green-800"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription className="font-medium">Arquivo selecionado: {formData.csv_file.name}</AlertDescription></Alert>}</div><Button variant="link" size="sm" onClick={downloadCSVTemplate} className="w-full"><Download className="h-4 w-4 mr-2" />Baixar modelo do CSV</Button></div></div>}
        {step === 'validation_summary' && validationResult && <div className="space-y-4 py-4"><MetricCard title="Leads Válidos Prontos para Importar" value={validationResult.valid_leads} icon={<CheckCircle/>} variant="success"/><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Pontos de Atenção na Lista</AlertTitle><AlertDescription><ul className="list-disc pl-5 space-y-1 mt-2"><li>Linhas totais no arquivo: <strong>{validationResult.total_rows}</strong></li><li>Telefones duplicados (serão ignorados): <strong>{validationResult.duplicate_phones}</strong></li><li>Telefones com formato inválido (serão ignorados): <strong>{validationResult.invalid_phones}</strong></li></ul></AlertDescription></Alert><p className="text-sm text-muted-foreground">Apenas os <strong>{validationResult.valid_leads} leads válidos</strong> serão importados. Deseja continuar e criar esta campanha?</p></div>}
        <DialogFooter className="pt-4 border-t"><Button variant="outline" onClick={resetAndClose}>Cancelar</Button>{step === 'form' && <Button onClick={handleValidate} disabled={!formData.csv_file}>Validar Lista de Leads</Button>}{step === 'validation_summary' && <Button onClick={handleCreateCampaign} disabled={!validationResult || validationResult.valid_leads === 0}><PlusCircle className="h-4 w-4 mr-2"/>Criar Campanha com {validationResult?.valid_leads} Leads</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ============================================================================
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignsResult, promptsResult] = await Promise.all([ getCampaigns(), getSystemPrompts() ]);
      if (campaignsResult.error) throw new Error(campaignsResult.error);
      if (promptsResult.error) throw new Error(promptsResult.error);
      setCampaigns(campaignsResult.data || []);
      setPrompts(promptsResult.data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error("Falha ao carregar dados", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunCampaign = useCallback(async (campaignId: string) => {
    const promise = runCampaign(campaignId);
    toast.promise(promise, {
        loading: "Enviando campanha para a fila de disparo...",
        success: (result) => {
            if (result.error) throw new Error(result.error);
            fetchData();
            return "Campanha iniciada com sucesso!";
        },
        error: (err) => `Falha ao disparar: ${err.message}`
    });
  }, [fetchData]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!campaignToDelete) return;
    const promise = deleteCampaign(campaignToDelete.id);
    toast.promise(promise, {
      loading: `Excluindo campanha "${campaignToDelete.name}"...`,
      success: (result) => {
        if (result.error) throw new Error(result.error);
        fetchData();
        setCampaignToDelete(null);
        return `Campanha excluída com sucesso!`;
      },
      error: (err) => `Erro ao excluir: ${err.message}`,
    });
  }, [campaignToDelete, fetchData]);

  // ============================================================================
  // CORREÇÃO 1: A classe `animate-spin` foi removida da configuração do status.
  // A animação agora será aplicada de forma condicional diretamente no ícone.
  // ============================================================================
  const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    'DRAFT': { label: 'Rascunho', icon: Edit, className: 'bg-gray-100 text-gray-800' },
    'ACTIVE': { label: 'Pronta Para Disparo', icon: Play, className: 'bg-blue-100 text-blue-800' },
    'PROCESSING': { label: 'Em Processamento', icon: Loader2, className: 'bg-yellow-100 text-yellow-800' }, // <- 'animate-spin' removido daqui
    'COMPLETED': { label: 'Concluída', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
    'FAILED': { label: 'Falhou', icon: XCircle, className: 'bg-red-100 text-red-800' },
  };

  const columns = useMemo((): ColumnDef<Campaign>[] => [
    { accessorKey: "name", header: "Campanha", cell: ({ row }) => (<div><p className="font-medium">{row.original.name}</p><p className="text-xs text-muted-foreground">{row.original.template_name || "Template não definido"}</p></div>) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => { 
        const status = (row.original.status || 'DRAFT').toUpperCase(); 
        const config = statusConfig[status] || { label: status, icon: AlertCircle, className: 'bg-gray-200' }; 
        const Icon = config.icon; 
        return (
          <Badge className={cn("capitalize", config.className)}>
            {/* ============================================================================ */}
            {/* CORREÇÃO 2: A classe `animate-spin` é aplicada condicionalmente aqui, */}
            {/* apenas no ícone e somente quando o status for 'PROCESSING'.               */}
            {/* ============================================================================ */}
            <Icon className={cn("h-3 w-3 mr-1.5", { "animate-spin": status === 'PROCESSING' })}/>
            {config.label}
          </Badge>
        ); 
    }},
    { accessorKey: "leads_count", header: "Leads", cell: ({ row }) => <span>{row.original.leads_count || 0}</span> },
    { accessorKey: "system_prompt_id", header: "Personalidade da IA", cell: ({ row }) => { const prompt = prompts.find(p => p.id === row.original.system_prompt_id); return <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{prompt?.name || "Padrão"}</span></div>; }},
    { accessorKey: "created_at", header: "Criada em", cell: ({ row }) => <span>{new Date(row.original.created_at).toLocaleDateString('pt-BR')}</span> },
    { id: "actions", header: () => <div className="text-right">Ações</div>, cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          {(row.original.status || 'DRAFT').toUpperCase() === 'ACTIVE' && (
            <Button size="sm" variant="outline" onClick={() => handleRunCampaign(row.original.id)}><Play className="h-4 w-4 mr-2" />Disparar</Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => toast.info("Modal de edição a ser implementado.")}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCampaignToDelete(row.original)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ], [prompts, handleRunCampaign, handleDeleteConfirm]); // Adicionado handleDeleteConfirm às dependências
  
  const stats = useMemo(() => ({
    total: campaigns.length,
    processing: campaigns.filter(c => (c.status || '').toUpperCase() === "PROCESSING").length,
    totalLeads: campaigns.reduce((acc, c) => acc + (c.leads_count || 0), 0),
    completed: campaigns.filter(c => (c.status || '').toUpperCase() === "COMPLETED").length,
  }), [campaigns]);

  return (
    <div className="space-y-6">
      <PageHeader title="Gerenciamento de Campanhas" description="Crie, valide e dispare suas campanhas de prospecção." action={<Button onClick={() => setIsNewCampaignModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" />Nova Campanha</Button>} />
      <StatsGrid>
        <MetricCard title="Total de Campanhas" value={stats.total} icon={<Send />} />
        <MetricCard title="Campanhas em Envio" value={stats.processing} icon={<Clock />} />
        <MetricCard title="Total de Leads" value={stats.totalLeads.toLocaleString()} icon={<Users />} />
        <MetricCard title="Campanhas Concluídas" value={stats.completed} icon={<Target />} />
      </StatsGrid>
      <Card>
        <CardHeader><CardTitle>Lista de Campanhas</CardTitle><CardDescription>Acompanhe o status e performance de suas campanhas ativas e passadas.</CardDescription></CardHeader>
        <CardContent>
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ocorreu um erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          <DataTable data={campaigns} columns={columns} loading={loading} />
        </CardContent>
      </Card>
      
      <NewCampaignModal isOpen={isNewCampaignModalOpen} onClose={() => setIsNewCampaignModalOpen(false)} onSuccess={fetchData} prompts={prompts} />
      
      <AlertDialog open={!!campaignToDelete} onOpenChange={() => setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a campanha <strong>{campaignToDelete?.name}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className={buttonVariants({ variant: "destructive" })}>Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}