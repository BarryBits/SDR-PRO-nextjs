"use server";
import { getRecentActivity } from "@/actions/dashboardActions";
import { SectionCard } from "../layout/section-card";
import { Activity, Calendar, MessageSquare, Users } from 'lucide-react';
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'novo_lead': return <Users className="h-4 w-4 text-accent" />;
      case 'nova_mensagem_recebida': return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'reuniao_agendada': return <Calendar className="h-4 w-4 text-success" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
};

export async function RecentActivityList() {
    const { data: activities } = await getRecentActivity();

    return (
        <SectionCard title="Atividade Recente" className="col-span-1 md:col-span-2 row-span-2">
            <div className="space-y-4 pt-4">
              {activities && activities.length > 0 ? activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg"><ActivityIcon type={activity.type} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{activity.details}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade recente.</p>}
            </div>
        </SectionCard>
    );
}