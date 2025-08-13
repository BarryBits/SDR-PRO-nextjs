"use server";

import { getTodaysMeetings } from "@/actions/dashboardActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

// ==================================================================
// PASSO 1: CORRIGIR A INTERFACE
// A propriedade `consultants` agora é um ARRAY de objetos ou nulo.
// ==================================================================
interface Meeting {
  id: string;
  name: string;
  phone: string;
  scheduled_at: string;
  consultant_id?: string;
  consultants?: {
    name: string;
    email: string;
  }[] | null; // <--- CORREÇÃO APLICADA AQUI
}

export async function TodaysMeetings() {
  const { data: meetings, error } = await getTodaysMeetings();

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Calendar className="h-5 w-5" />
            Erro ao carregar reuniões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Reuniões de Hoje
          {meetings && meetings.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {meetings.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Todas as reuniões agendadas para hoje
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!meetings || meetings.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma reunião agendada para hoje</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting: Meeting) => (
              <div 
                key={meeting.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{meeting.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(meeting.scheduled_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {meeting.phone}
                    </div>
                    
                    {/* ================================================================== */}
                    {/* PASSO 2: CORRIGIR O ACESSO AOS DADOS */}
                    {/* Verificamos se o array existe E não está vazio, depois acessamos o primeiro item [0]. */}
                    {/* ================================================================== */}
                    {meeting.consultants && meeting.consultants.length > 0 && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {meeting.consultants[0].name} 
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-3 w-3 mr-1" />
                    Contatar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}