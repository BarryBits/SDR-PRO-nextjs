import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
}

export async function createCalendarEvent(event: CalendarEvent): Promise<{ data: any | null; error: string | null }> {
  // TODO: Implementar lógica de autenticação do Google Calendar para o usuário logado
  // Por enquanto, simulando sucesso
  console.log("Evento de calendário simulado:", event);
  return { data: { message: "Evento criado com sucesso (simulado)" }, error: null };
}


