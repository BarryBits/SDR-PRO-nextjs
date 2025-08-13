"use client";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadSummaryTableProps {
  leads: {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    status: string;
    created_at: string;
    consultant?: {
      id: string;
      name: string;
      avatar_url?: string;
    };
  }[];
}

export function LeadSummaryTable({ leads }: LeadSummaryTableProps) {
  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "CONTACTED":
        return "bg-yellow-100 text-yellow-800";
      case "SCHEDULED":
        return "bg-purple-100 text-purple-800";
      case "CONVERTED":
        return "bg-green-100 text-green-800";
      case "LOST":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status.toUpperCase()) {
      case "NEW":
        return "Novo";
      case "CONTACTED":
        return "Contatado";
      case "SCHEDULED":
        return "Agendado";
      case "CONVERTED":
        return "Convertido";
      case "LOST":
        return "Perdido";
      default:
        return status;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Consultor</TableHead>
            <TableHead>Criado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-sm text-muted-foreground">{lead.company}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusText(lead.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.consultant ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={lead.consultant.avatar_url} />
                        <AvatarFallback>
                          {lead.consultant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{lead.consultant.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
