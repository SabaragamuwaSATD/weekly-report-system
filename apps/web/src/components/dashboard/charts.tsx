"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StatusByMemberRow } from "@/lib/chart-data";

const COLORS = ["#0f172a", "#3b82f6", "#f59e0b", "#16a34a", "#dc2626", "#8b5cf6"];

export function TasksCompletedTrendChart({
  data,
}: {
  data: { week: string; tasksCompleted: number }[];
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="tasksCompleted"
          stroke="#0f172a"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusByMemberChart({ data }: { data: StatusByMemberRow[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="DRAFT" stackId="a" fill="#94a3b8" />
        <Bar dataKey="SUBMITTED" stackId="a" fill="#3b82f6" />
        <Bar dataKey="NEEDS_CORRECTION" stackId="a" fill="#f59e0b" />
        <Bar dataKey="APPROVED" stackId="a" fill="#16a34a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WorkloadByProjectChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TimeByTaskTypeChart({
  data,
}: {
  data: { type: string; hours: number }[];
}) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="type" tick={{ fontSize: 12 }} width={100} />
        <Tooltip />
        <Bar dataKey="hours" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[250px] items-center justify-center text-sm text-slate-400">
      No data for the current filters
    </div>
  );
}
