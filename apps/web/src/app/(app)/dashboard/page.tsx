"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchReports } from "@/lib/reports-api";
import { fetchTeamMembers } from "@/lib/users-api";
import { fetchProjects } from "@/lib/projects-api";
import {
  tasksCompletedTrend,
  statusByMember,
  workloadByProject,
  timeByTaskType,
  recentActivity,
} from "@/lib/chart-data";
import {
  TasksCompletedTrendChart,
  StatusByMemberChart,
  WorkloadByProjectChart,
  TimeByTaskTypeChart,
} from "@/components/dashboard/charts";
import ActivityFeed from "@/components/dashboard/activity-feed";
import AssistantWidget from "@/components/dashboard/assistant-widget";
import type { Report, ReportStatus } from "@/types/report";
import type { UserSummary } from "@/types/user";
import type { Project } from "@/types/project";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  NEEDS_CORRECTION: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [members, setMembers] = useState<UserSummary[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [ownerFilter, setOwnerFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [weekStartFilter, setWeekStartFilter] = useState("");
  const [weekEndFilter, setWeekEndFilter] = useState("");

  useEffect(() => {
    fetchTeamMembers().then(setMembers);
    fetchProjects().then(setProjects);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchReports({
      owner: ownerFilter || undefined,
      project: projectFilter || undefined,
      status: statusFilter || undefined,
      weekStart: weekStartFilter || undefined,
      weekEnd: weekEndFilter || undefined,
      limit: 100,
    }).then((res) => {
      if (cancelled) return;
      setReports(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ownerFilter, projectFilter, statusFilter, weekStartFilter, weekEndFilter]);

  // Summary metrics computed client-side from the currently loaded (filtered) set.
  // For an internal tool of this scale, deriving these from the already-fetched
  // page is simpler and avoids a second round-trip; a much larger team would
  // want these aggregated server-side instead.
  const metrics = useMemo(() => {
    const submitted = reports.filter((r) => r.status === "SUBMITTED").length;
    const needsCorrection = reports.filter(
      (r) => r.status === "NEEDS_CORRECTION",
    ).length;
    const approved = reports.filter((r) => r.status === "APPROVED").length;
    const openBlockers = reports.reduce(
      (sum, r) => sum + r.content.blockers.filter((b) => !!b.text).length,
      0,
    );
    return {
      total: reports.length,
      submitted,
      needsCorrection,
      approved,
      openBlockers,
    };
  }, [reports]);

  const teamMembersOnly = members.filter((m) => m.role === "TEAM_MEMBER");

  const trendData = useMemo(() => tasksCompletedTrend(reports), [reports]);
  const statusData = useMemo(() => statusByMember(reports), [reports]);
  const workloadData = useMemo(() => workloadByProject(reports), [reports]);
  const timeData = useMemo(() => timeByTaskType(reports), [reports]);
  const activityData = useMemo(() => recentActivity(reports), [reports]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team Dashboard</h1>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="Reports (filtered)" value={metrics.total} />
        <MetricCard
          label="Submitted"
          value={metrics.submitted}
          accent="text-blue-700"
        />
        <MetricCard
          label="Needs Correction"
          value={metrics.needsCorrection}
          accent="text-amber-700"
        />
        <MetricCard
          label="Approved"
          value={metrics.approved}
          accent="text-green-700"
        />
        <MetricCard
          label="Open Blockers"
          value={metrics.openBlockers}
          accent="text-red-700"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded border bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-500">
            Team Member
          </label>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="mt-1 rounded border px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {teamMembersOnly.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">
            Project
          </label>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="mt-1 rounded border px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ReportStatus | "")
            }
            className="mt-1 rounded border px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">
            Week from
          </label>
          <input
            type="date"
            value={weekStartFilter}
            onChange={(e) => setWeekStartFilter(e.target.value)}
            className="mt-1 rounded border px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">
            Week to
          </label>
          <input
            type="date"
            value={weekEndFilter}
            onChange={(e) => setWeekEndFilter(e.target.value)}
            className="mt-1 rounded border px-2 py-1.5 text-sm"
          />
        </div>

        {(ownerFilter ||
          projectFilter ||
          statusFilter ||
          weekStartFilter ||
          weekEndFilter) && (
          <button
            onClick={() => {
              setOwnerFilter("");
              setProjectFilter("");
              setStatusFilter("");
              setWeekStartFilter("");
              setWeekEndFilter("");
            }}
            className="text-sm text-slate-500 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Report list */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-slate-500">No reports match these filters.</p>
      ) : (
        <div className="overflow-hidden rounded border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Team Member</th>
                <th className="px-4 py-2 font-medium">Week</th>
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const ownerName =
                  typeof r.owner === "string" ? r.owner : r.owner.name;
                const ownerId =
                  typeof r.owner === "string" ? r.owner : r.owner._id;
                const projectName =
                  typeof r.project === "string" ? r.project : r.project.name;
                return (
                  <tr
                    key={r._id}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => router.push(`/reports/${r._id}/view`)}
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/team/${ownerId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-900 underline hover:text-slate-600"
                      >
                        {ownerName}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.weekStart).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{projectName}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Tasks Completed Trend">
          <TasksCompletedTrendChart data={trendData} />
        </ChartCard>
        <ChartCard title="Report Status by Team Member">
          <StatusByMemberChart data={statusData} />
        </ChartCard>
        <ChartCard title="Workload by Project">
          <WorkloadByProjectChart data={workloadData} />
        </ChartCard>
        <ChartCard title="Time Spent by Task Type">
          <TimeByTaskTypeChart data={timeData} />
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
        <ActivityFeed events={activityData} />
      </div>

      <AssistantWidget />
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border bg-white p-4">
      <h3 className="mb-2 text-sm font-medium text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
