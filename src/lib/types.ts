// Caminho: src/lib/types.ts

/**
 * @fileoverview src/lib/types.ts
 *
 * FONTE DA VERDADE para todas as estruturas de dados e schemas de validação da aplicação.
 * Este arquivo centraliza todas as definições de tipo, garantindo consistência e robustez.
 * Utiliza Zod para validação em tempo de execução e inferência de tipos estáticos.
 *
 * @version 3.0.0 (Versão Sincronizada com o Banco de Dados)
 * @author Gemini Dev Lead & [Seu Nome]
 */
import { z } from "zod";
import type { OpenAI } from "openai";

// ========================================================================
// TIPOS E SCHEMAS RELACIONADOS A LEADS
// ========================================================================

export const LeadSchema = z.object({
  id: z.uuid(),
  client_id: z.uuid(),
  campaign_id: z.uuid().nullable().optional(),
  consultant_id: z.uuid().nullable().optional(),
  name: z.string().nullable().optional(),
  phone: z.string(),
  wa_id: z.string().nullable().optional(), // COLUNA ADICIONADA: ID do WhatsApp.
  email: z.email("O formato do email é inválido.").nullable().optional(),
  company: z.string().nullable().optional(),
  position: z.string().nullable().optional(), // COLUNA ADICIONADA: Cargo do lead.
  status: z.string(), // Usar z.string() é mais flexível que um enum gigante.
  source: z.string().nullable().optional(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),

  // Timestamps Cruciais para Automação
  last_contact_at: z.iso.datetime().nullable().optional(),
  last_incoming_message_at: z.iso.datetime().nullable().optional(),
  last_outgoing_message_at: z.iso.datetime().nullable().optional(),
  next_followup_at: z.iso.datetime().nullable().optional(),
  last_followup_at: z.iso.datetime().nullable().optional(),
  scheduled_at: z.iso.datetime().nullable().optional(),

  // Campos de Controle da IA e Nudges
  ai_status: z.string().default('active'),
  nudge_sequence_step: z.number().default(0),
  followup_attempts: z.number().default(0),
  
  // Flags de Lembrete
  meeting_reminder_sent: z.boolean().default(false),
  daily_reminder_sent: z.boolean().default(false),

  // Campos de Metadados
  custom_data: z.record(z.string(), z.any()).nullable().optional(),
  conversation_context: z.record(z.string(), z.any()).nullable().optional(),
  
  // Campos auxiliares para joins (usados na UI)
  campaign_name: z.string().nullable().optional(),
  consultant_name: z.string().nullable().optional(),
});

export const LeadCreateSchema = LeadSchema.pick({
  client_id: true,
  name: true,
  phone: true,
  email: true,
  company: true,
  position: true,
  status: true,
  consultant_id: true,
  campaign_id: true,
  custom_data: true,
});

export const LeadUpdateSchema = LeadCreateSchema.partial();

export type Lead = z.infer<typeof LeadSchema>;
export type LeadCreate = z.infer<typeof LeadCreateSchema>;
export type LeadUpdate = z.infer<typeof LeadUpdateSchema>;


// ========================================================================
// TIPOS E SCHEMAS RELACIONADOS A CAMPANHAS
// ========================================================================

export const CampaignSchema = z.object({
  id: z.uuid(),
  client_id: z.uuid(),
  name: z.string().min(1, "O nome da campanha é obrigatório."),
  status: z.string().default('draft'),
  
  // COLUNAS ADICIONADAS: Sincronizadas com a tabela 'campaigns'
  created_by: z.uuid().nullable().optional(),
  template_name: z.string().nullable().optional(), // No DB está como `template_name`, mas o código usa `template_name`. Mantive a consistência com o código.
  system_prompt_id: z.uuid().nullable().optional(),
  
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime().nullable().optional(),
  
  // Campos que vêm de Joins ou Cálculos, úteis para a UI
  leads_count: z.number().optional().default(0),
  system_prompt_name: z.string().nullable().optional(),
  
  // Campo usado no formulário, mas que não está na tabela do banco
  message_template: z.string().optional().nullable(),
});

export const CampaignCreateSchema = CampaignSchema.pick({
  name: true,
  status: true,
  message_template: true,
  template_name: true,
  system_prompt_id: true,
});

export const CampaignUpdateSchema = CampaignCreateSchema.partial();

export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignCreate = z.infer<typeof CampaignCreateSchema>;
export type CampaignUpdate = z.infer<typeof CampaignUpdateSchema>;


// ========================================================================
// TIPOS E SCHEMAS RELACIONADOS A CONSULTORES
// ========================================================================

export const ConsultantSchema = z.object({
  id: z.uuid(),
  client_id: z.uuid(),
  name: z.string().min(1, "O nome do consultor é obrigatório."),
  email: z.email("O formato do email é inválido."),
  phone: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  
  // COLUNAS ADICIONADAS: Sincronizadas com a tabela 'consultants'
  user_id: z.uuid().nullable().optional(),
  avatar_url: z.url().nullable().optional(),
  last_meeting_scheduled_at: z.iso.datetime().nullable().optional(), // Essencial para o round-robin
  
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime().nullable().optional(),
});

export const ConsultantCreateSchema = ConsultantSchema.pick({
  name: true,
  email: true,
  phone: true,
  is_active: true,
});

export const ConsultantUpdateSchema = ConsultantCreateSchema.partial();

export type Consultant = z.infer<typeof ConsultantSchema>;
export type ConsultantCreate = z.infer<typeof ConsultantCreateSchema>;
export type ConsultantUpdate = z.infer<typeof ConsultantUpdateSchema>;


// ========================================================================
// TIPOS E SCHEMAS RELACIONADOS A PROMPTS DE SISTEMA
// ========================================================================

export const SystemPromptSchema = z.object({
  id: z.uuid(),
  client_id: z.uuid(),
  // AVISO: A tabela no DB usa `prompt_name`. O código usa `name`. Mantive `name` pela consistência do código.
  // Recomendo rodar o SQL abaixo para alinhar o banco de dados.
  name: z.string().min(1, "O nome do prompt é obrigatório."),
  description: z.string().optional().nullable(), // Esta coluna precisa ser adicionada ao banco
  prompt_content: z.string().min(1, "O conteúdo do prompt é obrigatório."),
  is_default: z.boolean().default(false), // Esta coluna precisa ser adicionada ao banco
  is_active: z.boolean().default(true), // Esta coluna precisa ser adicionada ao banco
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime().optional().nullable(),
});

export const SystemPromptCreateSchema = SystemPromptSchema.pick({
  name: true,
  description: true,
  prompt_content: true,
  is_default: true,
  is_active: true,
});

export const SystemPromptUpdateSchema = SystemPromptCreateSchema.partial();

export type SystemPrompt = z.infer<typeof SystemPromptSchema>;
export type SystemPromptCreate = z.infer<typeof SystemPromptCreateSchema>;
export type SystemPromptUpdate = z.infer<typeof SystemPromptUpdateSchema>;


// ========================================================================
// TIPOS E SCHEMAS RELACIONADOS A MENSAGENS
// ========================================================================

export const MessageSchema = z.object({
  id: z.uuid(),
  lead_id: z.uuid(),
  direction: z.enum(['inbound', 'outbound']),
  role: z.enum(['user', 'assistant']),
  content: z.string().nullable(),
  created_at: z.iso.datetime(),
});

export type Message = z.infer<typeof MessageSchema>;


// ========================================================================
// TIPOS RELACIONADOS À IA E CONVERSAÇÃO
// ========================================================================

export type AITextResponse = { 
  type: 'text'; 
  content: string[];
};

export type AIToolCallResponse = { 
  type: 'tool_call'; 
  toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall;
};

export type AIResponse = AITextResponse | AIToolCallResponse;