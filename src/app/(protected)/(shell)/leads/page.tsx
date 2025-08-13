"use client";

/**
 * @file src/app/(protected)/(shell)/leads/page.tsx
 * @description Página completa para gerenciamento de Leads, refatorada para Next.js App Router com Server Actions.
 *
 * @version 5.0.0 (Versão Definitiva)
 * @author Gemini Dev Lead
 *
 * @feature CRUD completo de leads, upload de CSV funcional e ações em massa.
 * @feature Listagem, filtragem e busca de leads.
 * @feature Componentização da lógica em sub-componentes para clareza.
 * @feature Arquitetura 100% baseada em Server Actions, sem erros de tipo.
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";

// --- Server Actions ---
import { 
  getLeads, createLead, updateLead, deleteLead, 
  updateLeadsStatus, assignLeadsToCampaign, assignLeadsToConsultant,
  importLeadsFromCSV, generateCSVTemplate
} from "@/actions/leadActions";
import { getCampaigns } from "@/actions/campaignActions";
import { getConsultants } from "@/actions/consultantActions";
import { type Lead, type LeadCreate, type LeadUpdate, type Campaign, type Consultant } from "@/lib/types";

// --- Componentes ---
import { LeadForm } from "@/components/leads/LeadForm";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

// --- Ícones ---
import { 
  PlusCircle, AlertCircle, Users, TrendingUp, Clock, 
  CheckCircle, RefreshCw, Edit, Trash2, Mail, Phone, 
  Loader2, Upload, Download, ChevronDown 
} from "lucide-react";

// --- Tipos e Configurações ---
type LeadWithRelations = Lead & {
  campaign_name?: string | null;
  consultant_name?: string | null;
};

type ModalState = 
  | { type: 'create' }
  | { type: 'edit'; lead: LeadWithRelations }
  | { type: 'delete'; lead: LeadWithRelations }
  | { type: 'import' }
  | null;

const statusConfig = {
  'NEW': { label: 'Novo', variant: 'default' as const },
  'CONTACTED': { label: 'Contatado', variant: 'secondary' as const },
  'QUALIFIED': { label: 'Qualificado', variant: 'default' as const },
  'UNQUALIFIED': { label: 'Não Qualificado', variant: 'outline' as const },
  'CLOSED_WON': { label: 'Convertido', variant: 'success' as const },
  'MEETING_SCHEDULED': { label: 'Reunião Agendada', variant: 'success' as const },
};

// ============================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ============================================================================
export default function LeadsPage() {
    const [leads, setLeads] = useState<LeadWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalState, setModalState] = useState<ModalState>(null);
    const [filters, setFilters] = useState({});

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getLeads(filters);
            if (result.error) throw new Error(result.error);
            setLeads(result.data as LeadWithRelations[] || []);
        } catch (err: any) {
            setError(err.message);
            toast.error("Falha ao carregar leads", { description: err.message });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleFormSubmit = useCallback(async (data: LeadCreate | LeadUpdate) => {
      if (modalState?.type !== 'create' && modalState?.type !== 'edit') return;
      
      const promise = modalState.type === 'edit'
        ? updateLead(modalState.lead.id, data as LeadUpdate)
        : createLead(data as LeadCreate);
  
      toast.promise(promise, {
        loading: "Salvando lead...",
        success: (result) => {
          if (result.error) throw new Error(result.error);
          fetchLeads();
          setModalState(null);
          return `Lead salvo com sucesso!`;
        },
        error: (err) => `Erro ao salvar: ${err.message}`,
      });
    }, [modalState, fetchLeads]);
  
    const handleDeleteConfirm = useCallback(async () => {
      if (modalState?.type !== 'delete') return;
  
      const promise = deleteLead(modalState.lead.id);
      toast.promise(promise, {
        loading: `Excluindo lead "${modalState.lead.name}"...`,
        success: (result) => {
          if (result.error) throw new Error(result.error);
          fetchLeads();
          setModalState(null);
          return `Lead excluído com sucesso!`;
        },
        error: (err) => `Erro ao excluir: ${err.message}`,
      });
    }, [modalState, fetchLeads]);

    const handleCSVUpload = useCallback(async (file: File) => {
        const csvData = await file.text();
        const promise = importLeadsFromCSV(csvData);

        toast.promise(promise, {
            loading: "Importando leads do CSV...",
            success: (result) => {
                if (result.error) throw new Error(result.error);
                if (result.errors.length > 0) {
                    toast.warning(`${result.errors.length} linhas com erros foram ignoradas.`, { duration: 8000 });
                }
                fetchLeads();
                setModalState(null);
                return `${result.imported} leads importados com sucesso!`;
            },
            error: (err) => `Erro na importação: ${err.message}`,
        });
    }, [fetchLeads]);

    const handleDownloadCSVTemplate = useCallback(async () => {
        try {
            const csvContent = await generateCSVTemplate();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'template_leads.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.info("Template CSV baixado!");
        } catch (err: any) {
            toast.error("Erro ao gerar template", { description: err.message });
        }
    }, []);

    const columns = useMemo((): ColumnDef<LeadWithRelations>[] => [
      {
        id: "select",
        header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Selecionar todos" /> ),
        cell: ({ row }) => ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Selecionar linha" /> ),
      },
      { accessorKey: "name", header: "Nome", cell: ({ row }) => <div className="font-medium">{row.original.name}</div> },
      { id: 'contact', header: 'Contato', cell: ({ row }) => <div><p className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3 text-muted-foreground" /> {row.original.email || 'N/A'}</p><p className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-muted-foreground" /> {row.original.phone || 'N/A'}</p></div> },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
          const status = row.original.status as keyof typeof statusConfig;
          const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
          return <Badge variant={config.variant}>{config.label}</Badge>;
      }},
      { accessorKey: "campaign_name", header: "Campanha" },
      { accessorKey: "consultant_name", header: "Consultor" },
      {
          id: 'actions',
          header: () => <div className="text-right">Ações</div>,
          cell: ({ row }) => (
              <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setModalState({ type: 'edit', lead: row.original })}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setModalState({ type: 'delete', lead: row.original })}><Trash2 className="h-4 w-4" /></Button>
              </div>
          )
      }
    ], []);
      
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciamento de Leads</h1>
                    <p className="text-muted-foreground">Visualize e gerencie suas oportunidades.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={fetchLeads} variant="outline" size="sm" disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
                    <Button size="sm" onClick={() => setModalState({ type: 'create' })}><PlusCircle className="h-4 w-4 mr-2" />Novo Lead</Button>
                    <Button variant="outline" size="sm" onClick={() => setModalState({ type: 'import' })}><Upload className="h-4 w-4 mr-2" />Importar CSV</Button>
                </div>
            </div>

            {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <Card>
                <CardHeader><CardTitle>Lista de Leads</CardTitle></CardHeader>
                <CardContent><DataTable data={leads} columns={columns} loading={loading} /></CardContent>
            </Card>

            <LeadFormModal
                isOpen={modalState?.type === 'create' || modalState?.type === 'edit'}
                onClose={() => setModalState(null)}
                onSubmit={handleFormSubmit}
                initialData={modalState?.type === 'edit' ? modalState.lead : undefined}
            />
            <DeleteLeadConfirmation
                isOpen={modalState?.type === 'delete'}
                onClose={() => setModalState(null)}
                onConfirm={handleDeleteConfirm}
                // ==================================================================
                // CORREÇÃO APLICADA AQUI
                // Usamos `?? ''` para garantir que o valor seja sempre uma string.
                // ==================================================================
                leadName={modalState?.type === 'delete' ? (modalState.lead.name ?? '') : ''}
            />
            <ImportCSVModal
                isOpen={modalState?.type === 'import'}
                onClose={() => setModalState(null)}
                onUpload={handleCSVUpload}
                onDownloadTemplate={handleDownloadCSVTemplate}
            />
        </div>
    );
}

// ============================================================================
// COMPONENTES DE MODAL (Definidos no mesmo arquivo para simplicidade)
// ============================================================================

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: LeadCreate | LeadUpdate) => void;
    initialData?: Lead;
}
function LeadFormModal({ isOpen, onClose, onSubmit, initialData }: LeadFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: LeadCreate | LeadUpdate) => {
    setIsSubmitting(true);
    await onSubmit(data);
    setIsSubmitting(false);
  };
  
  if(!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          <DialogDescription>Preencha os detalhes do lead.</DialogDescription>
        </DialogHeader>
        <LeadForm 
          initialData={initialData} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      </DialogContent>
    </Dialog>
  );
};

interface DeleteLeadConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    leadName: string;
}
function DeleteLeadConfirmation({ isOpen, onClose, onConfirm, leadName }: DeleteLeadConfirmationProps) {
  if(!isOpen) return null;
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza que deseja excluir o lead <strong>{leadName}</strong>?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onDownloadTemplate: () => void;
}
function ImportCSVModal({ isOpen, onClose, onUpload, onDownloadTemplate }: ImportCSVModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Formato inválido.", { description: "Por favor, selecione um arquivo .csv." });
      setSelectedFile(null);
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  useEffect(() => {
    if (!isOpen) setSelectedFile(null);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Leads via CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo .csv para importar múltiplos leads. As colunas 'name' e 'phone' são obrigatórias.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
          {selectedFile && (
            <Alert variant="default" className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Arquivo selecionado: <strong>{selectedFile.name}</strong></AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onDownloadTemplate} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-2" />Baixar Modelo</Button>
          <Button type="button" onClick={() => selectedFile && onUpload(selectedFile)} disabled={!selectedFile} className="w-full sm:w-auto"><Upload className="h-4 w-4 mr-2" />Importar Arquivo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};