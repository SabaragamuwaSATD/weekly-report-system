"use client";

import { useState } from "react";
import type { ReportVersion, ReviewEntry } from "@/types/report";

const ACTION_STYLES: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  CHANGES_REQUESTED: "bg-amber-100 text-amber-700",
};

export default function ReviewTimeline({
  versions,
  reviews,
}: {
  versions: ReportVersion[];
  reviews: ReviewEntry[];
}) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  if (versions.length === 0) {
    return <p className="text-sm text-slate-400">No submissions yet.</p>;
  }

  // Build a combined, chronological timeline: each version's submission,
  // followed by whatever review was made against it.
  const items = versions.map((v) => ({
    version: v,
    review: reviews.find((r) => r.versionNumber === v.versionNumber),
  }));

  return (
    <div className="space-y-3">
      {items.map(({ version, review }) => {
        const reviewerName =
          review && typeof review.reviewedBy === "object"
            ? review.reviewedBy.name
            : null;

        return (
          <div key={version.versionNumber} className="rounded border bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-sm font-medium">
                  Version {version.versionNumber}
                </span>
                <span className="ml-2 text-xs text-slate-400">
                  submitted {new Date(version.submittedAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() =>
                  setExpandedVersion(
                    expandedVersion === version.versionNumber
                      ? null
                      : version.versionNumber,
                  )
                }
                className="text-xs text-slate-500 underline"
              >
                {expandedVersion === version.versionNumber
                  ? "Hide content"
                  : "View this version"}
              </button>
            </div>

            {review && (
              <div className="border-t px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${ACTION_STYLES[review.action]}`}
                  >
                    {review.action.replace("_", " ")}
                  </span>
                  {reviewerName && (
                    <span className="text-xs text-slate-400">
                      by {reviewerName} on{" "}
                      {new Date(review.reviewedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-slate-700">
                    {review.comment}
                  </p>
                )}
              </div>
            )}

            {!review && (
              <div className="border-t px-4 py-3 text-xs text-slate-400">
                Awaiting manager review
              </div>
            )}

            {expandedVersion === version.versionNumber && (
              <div className="space-y-4 border-t bg-slate-50 p-4">
                <VersionSummary content={version.content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// A compact, read-only summary — not the full TaskTable, since this is
// nested inside an expandable row and needs to stay lightweight.
function VersionSummary({ content }: { content: ReportVersion["content"] }) {
  return (
    <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
      <div>
        <p className="font-medium text-slate-800">Tasks completed</p>
        <ul className="list-inside list-disc">
          {content.tasksCompleted.map((t, i) => (
            <li key={i}>
              {t.taskName} — {t.status} ({t.actualPercent}%)
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium text-slate-800">Tasks planned</p>
        <ul className="list-inside list-disc">
          {content.tasksPlannedNextWeek.map((t, i) => (
            <li key={i}>{t.taskName}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium text-slate-800">Blockers</p>
        <ul className="list-inside list-disc">
          {content.blockers.map((b, i) => (
            <li key={i}>
              {b.text}
              {b.isKey ? " (key)" : ""}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium text-slate-800">Achievements</p>
        <ul className="list-inside list-disc">
          {content.achievements.map((a, i) => (
            <li key={i}>
              {a.text}
              {a.isKey ? " (key)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
