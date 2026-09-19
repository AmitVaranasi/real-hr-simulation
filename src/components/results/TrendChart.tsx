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

  const first = data[0];
  const last = data[data.length - 1];
  const description = `Line chart of Balanced Scorecard trends across ${data.length} rounds, from ${first.round} to ${last.round}. Total score moved from ${first.total} to ${last.total}.`;

  return (
    <div className="rounded-xl border border-[var(--portal-sidebar-border)] bg-white p-4">
      <h3 id="trend-chart-title" className="mb-4 font-semibold text-[var(--portal-title)]">
        Score trends
      </h3>
      <div
        className="h-64"
        role="img"
        aria-labelledby="trend-chart-title"
        aria-describedby="trend-chart-description"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="var(--portal-primary)" strokeWidth={2} />
            <Line type="monotone" dataKey="financial" stroke="#10b981" />
            <Line type="monotone" dataKey="employee" stroke="#f59e0b" />
            <Line type="monotone" dataKey="process" stroke="#6366f1" />
            <Line type="monotone" dataKey="learning" stroke="#ec4899" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p id="trend-chart-description" className="sr-only">
        {description}
      </p>
      <table className="sr-only">
        <caption>Score trends by round — underlying data for the chart above</caption>
        <thead>
          <tr>
            <th scope="col">Round</th>
            <th scope="col">Total</th>
            <th scope="col">Financial</th>
            <th scope="col">Employee</th>
            <th scope="col">Internal Process</th>
            <th scope="col">Learning &amp; Growth</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.round}>
              <th scope="row">{point.round}</th>
              <td>{point.total}</td>
              <td>{point.financial}</td>
              <td>{point.employee}</td>
              <td>{point.process}</td>
              <td>{point.learning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
