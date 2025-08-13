"use server";
import { getUpcomingEvents } from "@/actions/dashboardActions";
import { SectionCard } from "../layout/section-card";
import { Calendar, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function UpcomingEventsList() {
    const { data: events } = await getUpcomingEvents();

    return (
        <SectionCard title="Próximas Reuniões" className="col-span-1 md:col-span-2 row-span-2">
            <div className="space-y-4 pt-4">
              {events && events.length > 0 ? events.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20 hover:bg-success/10 transition-colors">
                  <div className="p-2 bg-success/10 rounded-lg"><Calendar className="h-4 w-4 text-success" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.scheduled_at), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-primary mt-1 font-medium flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3" />
                      {event.consultant_name}
                    </p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-8">Nenhuma reunião agendada.</p>}
            </div>
        </SectionCard>
    );
}