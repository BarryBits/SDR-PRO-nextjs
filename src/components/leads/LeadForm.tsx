"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { 
  type LeadCreate, 
  type LeadUpdate, 
  type Lead,
  type Campaign,
  type Consultant
} from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCampaigns } from "@/actions/campaignActions";
import { getConsultants } from "@/actions/consultantActions";

// ==================================================================
// PASSO 1: CRIAR UM TIPO ESPECÍFICO PARA OS DADOS DO FORMULÁRIO
// Usamos `Omit` para criar um novo tipo baseado no `LeadCreate`, mas removendo a chave 'client_id'.
// ==================================================================
type LeadFormData = Omit<LeadCreate, "client_id">;

interface LeadFormProps {
  initialData?: Lead;
  // O onSubmit agora espera os dados do formulário, sem o client_id.
  onSubmit: (data: LeadFormData | LeadUpdate) => Promise<void>;
  isSubmitting: boolean;
}

// ==================================================================
// PASSO 2: USAR O NOVO TIPO NO ESTADO INICIAL
// Agora o INITIAL_FORM_STATE não precisa mais do client_id e o TypeScript fica feliz.
// ==================================================================
const INITIAL_FORM_STATE: LeadFormData = {
  name: "",
  phone: "",
  email: "",
  company: "",
  position: "",
  status: "NEW",
  campaign_id: undefined,
  consultant_id: undefined,
  custom_data: {}, // Adicionado para garantir que todas as propriedades de LeadCreate (exceto client_id) estejam presentes
};

export function LeadForm({ initialData, onSubmit, isSubmitting }: LeadFormProps) {
  // ==================================================================
  // PASSO 3: USAR O NOVO TIPO NO ESTADO DO COMPONENTE
  // ==================================================================
  const [formState, setFormState] = useState<LeadFormData | LeadUpdate>(INITIAL_FORM_STATE);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadDependencies() {
      setLoadingData(true);
      const [campaignsResult, consultantsResult] = await Promise.all([
        getCampaigns(),
        getConsultants(),
      ]);

      if (!campaignsResult.error) {
        setCampaigns(campaignsResult.data || []);
      }
      if (!consultantsResult.error) {
        setConsultants(consultantsResult.data || []);
      }
      setLoadingData(false);
    }
    loadDependencies();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormState({
        name: initialData.name,
        phone: initialData.phone,
        email: initialData.email || "",
        company: initialData.company || "",
        position: initialData.position || "",
        status: initialData.status,
        campaign_id: initialData.campaign_id || undefined,
        consultant_id: initialData.consultant_id || undefined,
        custom_data: initialData.custom_data || {},
      });
    } else {
      setFormState(INITIAL_FORM_STATE);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value === "none" ? undefined : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formState);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" value={formState.name || ""} onChange={handleInputChange} required />
      </div>
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" value={formState.phone || ""} onChange={handleInputChange} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={formState.email || ""} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="company">Empresa</Label>
        <Input id="company" name="company" value={formState.company || ""} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="position">Cargo</Label>
        <Input id="position" name="position" value={formState.position || ""} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formState.status || "NEW"} onValueChange={(value) => handleSelectChange("status", value)}>
          <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW">Novo</SelectItem>
            <SelectItem value="CONTACTED">Contatado</SelectItem>
            <SelectItem value="QUALIFIED">Qualificado</SelectItem>
            <SelectItem value="UNQUALIFIED">Não Qualificado</SelectItem>
            <SelectItem value="CLOSED_WON">Convertido</SelectItem>
            <SelectItem value="MEETING_SCHEDULED">Reunião Agendada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="campaign_id">Campanha</Label>
        <Select value={formState.campaign_id || "none"} onValueChange={(value) => handleSelectChange("campaign_id", value)}>
          <SelectTrigger><SelectValue placeholder="Selecione uma campanha" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma Campanha</SelectItem>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="consultant_id">Consultor</Label>
        <Select value={formState.consultant_id || "none"} onValueChange={(value) => handleSelectChange("consultant_id", value)}>
          <SelectTrigger><SelectValue placeholder="Selecione um consultor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum Consultor</SelectItem>
            {consultants.map((consultant) => (
              <SelectItem key={consultant.id} value={consultant.id}>{consultant.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Lead
        </Button>
      </div>
    </form>
  );
}