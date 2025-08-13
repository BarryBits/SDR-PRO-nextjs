"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: "bar" | "pie";
  data: any[];
  dataKeys: {
    x?: string;
    y?: string[];
    name?: string; 
    value?: string;
    colors?: string[];
  };
  height?: number;
  loading?: boolean;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  type,
  data,
  dataKeys,
  height = 300,
  loading = false,
  className,
}: ChartCardProps) {

  const renderContent = () => {
    if (loading) {
      return <Skeleton className="h-full w-full" />;
    }
    if (!data || data.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nenhum dado disponível</div>;
    }

    if (type === 'pie' && dataKeys.name && dataKeys.value) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
              }}
            />
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey={dataKeys.value} nameKey={dataKeys.name}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={dataKeys.colors?.[index % dataKeys.colors.length] || 'hsl(var(--primary))'} />
              ))}
            </Pie>
            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    
    if (type === 'bar' && dataKeys.x && dataKeys.y) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis dataKey={dataKeys.x} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
            {dataKeys.y.map((key, index) => (
              <Bar key={key} dataKey={key} fill={dataKeys.colors?.[index % dataKeys.colors.length] || 'hsl(var(--primary))'} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return <div className="flex items-center justify-center h-full text-destructive text-sm">Configuração de gráfico inválida</div>;
  };

  return (
    <Card className={cn("border-white/10 bg-black/20 backdrop-blur-xl shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="font-heading">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent style={{ height }}>
        {renderContent()}
      </CardContent>
    </Card>
  );
}