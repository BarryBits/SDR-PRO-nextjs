"use client";

import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

interface ChartComponentProps {
  type: "line" | "bar";
  data: any[];
  dataKeys: {
    x: string;
    y: string | string[];
    colors?: string[];
  };
  height?: number;
}

export default function ChartComponent({
  type,
  data,
  dataKeys,
  height = 300,
}: ChartComponentProps) {
  const colors = dataKeys.colors || ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === "line" ? (
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey={dataKeys.x} 
            tick={{ fontSize: 12 }} 
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#fff", 
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }} 
          />
          <Legend />
          {Array.isArray(dataKeys.y) ? (
            dataKeys.y.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={dataKeys.y}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey={dataKeys.x} 
            tick={{ fontSize: 12 }} 
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#fff", 
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }} 
          />
          <Legend />
          {Array.isArray(dataKeys.y) ? (
            dataKeys.y.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))
          ) : (
            <Bar
              dataKey={dataKeys.y}
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
