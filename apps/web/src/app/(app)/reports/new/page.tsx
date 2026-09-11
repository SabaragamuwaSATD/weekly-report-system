"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createReport } from "@/lib/reports-api";
import { fetchProjects } from "@/lib/projects-api";
import type { Project } from "@/types/project";
import { ApiError } from "@/lib/api";

// Snap to the Monday of the current week as a sensible default
function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default function NewReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setProjectId(data[0]._id);
    });
  }, []);

  const weekEnd = (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const report = await createReport({
        weekStart,
        weekEnd,
        project: projectId,
      });
      router.push(`/reports/${report._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">New Weekly Report</h1>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded border bg-white p-6"
      >
        <div>
          <label className="block text-sm font-medium">
            Week starting (Monday)
          </label>
          <input
            type="date"
            required
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">
            Covers {weekStart} to {weekEnd}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Project / Category
          </label>
          <select
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !projectId}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Draft"}
        </button>
      </form>
    </div>
  );
}
