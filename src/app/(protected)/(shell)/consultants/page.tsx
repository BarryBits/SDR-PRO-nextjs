"use client";

/**
 * @file src/app/(protected)/(shell)/consultants/page.tsx
 * @description Página completa para gerenciamento de Consultores, 100% compatível com a nova arquitetura.
 *
 * @version 2.0.0 (Versão Definitiva)
 * @author Gemini Dev Lead
 *
 * @feature CRUD completo de consultores.
 * @feature Compatibilidade total com o novo componente DataTable e @tanstack/react-table.
 * @feature Tipagem robusta, hooks otimizados e componentização da lógica.
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";

// --- Server Actions e Tipos ---
import { 
  getConsultants, 
  createConsultant, 
  updateConsultant, 
  deleteConsultant 
} from "@/actions/consultantActions";
import { type Consultant, type ConsultantCreate, type ConsultantUpdate } from "@/lib/types"; // Importação correta

// --- Componentes da UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Ícones ---
import { PlusCircle, AlertCircle, RefreshCw, User, Loader2, Edit, Trash2 } from "lucide-react";

// Hook customizado para gerenciar os dados dos consultores
function useConsultantsData() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const result = await getConsultants();
        if (result.error) throw new Error(result.error);
        setConsultants(result.data || []);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultants();
  }, [fetchConsultants]);

  return { consultants, loading, error, refetch: fetchConsultants };
}

// Estado inicial do formulário
const INITIAL_FORM_STATE: ConsultantCreate = {
  name: "",
  email: "",
  phone: "",
  is_active: true,
};

export default function ConsultantsPage() {
  const { consultants, loading, error, refetch } = useConsultantsData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [formState, setFormState] = useState<Partial<ConsultantCreate>>(INITIAL_FORM_STATE);

  useEffect(() => {
    if (editingConsultant) {
      setFormState({
        name: editingConsultant.name,
        email: editingConsultant.email,
        phone: editingConsultant.phone,
        is_active: editingConsultant.is_active,
      });
    } else {
      setFormState(INITIAL_FORM_STATE);
    }
  }, [editingConsultant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormState(prev => ({ ...prev, active: checked }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email) {
      toast.error("Nome e email são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    
    const actionPromise = editingConsultant
      ? updateConsultant(editingConsultant.id, formState as ConsultantUpdate)
      : createConsultant(formState as ConsultantCreate);

    toast.promise(actionPromise, {
      loading: "Salvando consultor...",
      success: (result) => {
        if (result.error) throw new Error(result.error);
        refetch();
        setIsModalOpen(false);
        setEditingConsultant(null);
        return `Consultor salvo com sucesso!`;
      },
      error: (err) => `Erro ao salvar: ${err.message}`,
      finally: () => setIsSubmitting(false),
    });
  }, [editingConsultant, formState, refetch]);

  const handleDelete = useCallback((consultant: Consultant) => {
    const promise = deleteConsultant(consultant.id);
    
    toast.promise(promise, {
      loading: `Excluindo consultor "${consultant.name}"...`,
      success: (result) => {
        if (result.error) throw new Error(result.error);
        refetch();
        return `Consultor excluído com sucesso!`;
      },
      error: (err) => `Erro ao excluir: ${err.message}`,
    });
  }, [refetch]);

  const columns = useMemo((): ColumnDef<Consultant>[] => [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Telefone",
      cell: ({ row }) => <span>{row.original.phone || "N/A"}</span>,
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Criado em",
      cell: ({ row }) => <span>{new Date(row.original.created_at).toLocaleDateString('pt-BR')}</span>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { 
              setEditingConsultant(row.original); 
              setIsModalOpen(true); 
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o consultor <strong>{row.original.name}</strong>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDelete(row.original)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ], [handleDelete]); // Array de dependências corrigido

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Consultores</h1>
          <p className="text-muted-foreground">Gerencie sua equipe de consultores</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button 
            size="sm" 
            onClick={() => { 
              setEditingConsultant(null); 
              setIsModalOpen(true); 
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Consultor
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingConsultant ? "Editar Consultor" : "Novo Consultor"}</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" value={formState.name || ""} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formState.email || ""} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" value={formState.phone || ""} onChange={handleInputChange} placeholder="(11) 99999-9999" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="active" checked={formState.is_active} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="active">Consultor ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader><CardTitle>Lista de Consultores</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={consultants} columns={columns} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}