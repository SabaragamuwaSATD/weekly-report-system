"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMyReports } from "@/lib/reports-api";
import type { Report, ReportStatus } from "@/types/report";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  NEEDS_CORRECTION: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

const STATUS_OPTIONS: (ReportStatus | "ALL")[] = [
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "NEEDS_CORRECTION",
  "APPROVED",
];

export default function MyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">(
    "ALL",
  );

  useEffect(() => {
    fetchMyReports().then((res) => {
      setReports(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const list =
      statusFilter === "ALL"
        ? reports
        : reports.filter((r) => r.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime(),
    );
  }, [reports, statusFilter]);

  // The link target depends on status: editable reports go to the edit page,
  // everything else goes straight to the read-only detail page.
  function linkFor(report: Report) {
    const editable =
      report.status === "DRAFT" || report.status === "NEEDS_CORRECTION";
    return editable ? `/reports/${report._id}` : `/reports/${report._id}/view`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Reports</h1>
        <Link
          href="/reports/new"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          + New Report
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs ${
              statusFilter === s
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {s === "ALL" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No reports match this filter.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Link
              key={r._id}
              href={linkFor(r)}
              className="flex items-center justify-between rounded border bg-white px-4 py-3 hover:bg-slate-50"
            >
              <span className="text-sm font-medium">
                Week of {new Date(r.weekStart).toLocaleDateString()} —{" "}
                {typeof r.project === "string" ? r.project : r.project.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[r.status]}`}
              >
                {r.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
