"use client";

import Link from "next/link";
import type { ActivityEvent } from "@/lib/chart-data";

const ACTION_LABEL: Record<string, string> = {
  APPROVED: "approved",
  CHANGES_REQUESTED: "sent back for correction",
};
const ACTION_COLOR: Record<string, string> = {
  APPROVED: "text-green-700",
  CHANGES_REQUESTED: "text-amber-700",
};

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-400">No recent review activity.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <Link
          key={i}
          href={`/reports/${e.reportId}/view`}
          className="block rounded border bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          <span className="font-medium">{e.ownerName}&apos;s</span> report was{" "}
          <span className={ACTION_COLOR[e.action]}>{ACTION_LABEL[e.action]}</span>
          <span className="ml-2 text-xs text-slate-400">
            {new Date(e.at).toLocaleString()}
          </span>
          {e.comment && (
            <p className="mt-1 text-xs text-slate-500">&quot;{e.comment}&quot;</p>
          )}
        </Link>
      ))}
    </div>
  );
}
