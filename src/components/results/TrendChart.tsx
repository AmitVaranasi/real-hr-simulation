"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendPoint {
  round: string;
  total: number;
  financial: number;
  employee: number;
  process: number;
  learning: number;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-4 font-semibold text-slate-900">Score trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#e67e22" strokeWidth={2} />
            <Line type="monotone" dataKey="financial" stroke="#10b981" />
            <Line type="monotone" dataKey="employee" stroke="#f59e0b" />
            <Line type="monotone" dataKey="process" stroke="#6366f1" />
            <Line type="monotone" dataKey="learning" stroke="#ec4899" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
