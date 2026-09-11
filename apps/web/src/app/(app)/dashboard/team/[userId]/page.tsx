"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchUser } from "@/lib/users-api";
import { fetchReports } from "@/lib/reports-api";
import type { UserSummary } from "@/types/user";
import type { Report } from "@/types/report";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  NEEDS_CORRECTION: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

export default function TeamMemberProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchUser(userId),
      fetchReports({ owner: userId, limit: 100 }),
    ]).then(([userData, reportsRes]) => {
      if (cancelled) return;
      setUser(userData);
      setReports(
        [...reportsRes.data].sort(
          (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime(),
        ),
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const stats = useMemo(() => {
    const total = reports.length;
    const approved = reports.filter((r) => r.status === "APPROVED").length;
    const needsCorrection = reports.filter(
      (r) => r.status === "NEEDS_CORRECTION",
    ).length;
    const totalCorrectionCycles = reports.reduce(
      (sum, r) =>
        sum + r.reviews.filter((rv) => rv.action === "CHANGES_REQUESTED").length,
      0,
    );
    return { total, approved, needsCorrection, totalCorrectionCycles };
  }, [reports]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!user) return <p className="text-sm text-red-600">Team member not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{user.name}</h1>
        <p className="text-sm text-slate-500">{user.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Reports" value={stats.total} />
        <StatCard
          label="Approved"
          value={stats.approved}
          accent="text-green-700"
        />
        <StatCard
          label="Needs Correction"
          value={stats.needsCorrection}
          accent="text-amber-700"
        />
        <StatCard
          label="Correction Cycles (all time)"
          value={stats.totalCorrectionCycles}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Report History</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-500">No reports submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => {
              const projectName =
                typeof r.project === "string" ? r.project : r.project.name;
              return (
                <Link
                  key={r._id}
                  href={`/reports/${r._id}/view`}
                  className="flex items-center justify-between rounded border bg-white px-4 py-3 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium">
                    Week of {new Date(r.weekStart).toLocaleDateString()} —{" "}
                    {projectName}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
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
