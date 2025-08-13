"use client";

import { StatCard } from "@/components/dashboard/stat-card";

type LeadCardProps = {
  status: string;   // Ex.: "Novo"
  count: number;    // Ex.: 32
};

/**
 * Wrapper simples que adapta os props esperados na UI
 * para os props do StatCard (title + value).
 */
export default function LeadCard({ status, count }: LeadCardProps) {
  return (
    <StatCard
      title={status}
      value={count}
      description="Leads"
      className="min-h-[120px]"
    />
  );
}
