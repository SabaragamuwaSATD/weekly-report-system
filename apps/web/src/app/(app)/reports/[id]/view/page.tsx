"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchReport, reviewReport } from "@/lib/reports-api";
import { getCurrentUser } from "@/lib/auth-api";
import type { Report } from "@/types/report";
import type { CurrentUser } from "@/types/auth";
import { ApiError } from "@/lib/api";
import TaskTable from "@/components/reports/task-table";
import NoteList from "@/components/reports/note-list";
import HoursEditor from "@/components/reports/hours-editor";
import ReviewTimeline from "@/components/reports/review-timeline";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  NEEDS_CORRECTION: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

export default function ReportViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchReport(id), getCurrentUser()])
      .then(([reportData, userData]) => {
        if (cancelled) return;
        setReport(reportData);
        setCurrentUser(userData);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isManager = currentUser?.role === "MANAGER";
  const canReview = isManager && report?.status === "SUBMITTED";

  async function handleReview(action: "APPROVED" | "CHANGES_REQUESTED") {
    if (action === "CHANGES_REQUESTED" && !reviewComment.trim()) {
      setError("A comment is required when requesting changes.");
      return;
    }
    if (
      !confirm(
        `${action === "APPROVED" ? "Approve" : "Send back for correction"} this report?`,
      )
    ) {
      return;
    }
    setError(null);
    setReviewing(true);
    try {
      const updated = await reviewReport(id, action, reviewComment || undefined);
      setReport(updated);
      setReviewComment("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit review");
    } finally {
      setReviewing(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error || !report)
    return <p className="text-sm text-red-600">{error ?? "Not found"}</p>;

  const projectName =
    typeof report.project === "string" ? report.project : report.project.name;
  const ownerName =
    typeof report.owner === "string" ? report.owner : report.owner.name;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Week of {new Date(report.weekStart).toLocaleDateString()} —{" "}
            {projectName}
          </h1>
          <p className="text-sm text-slate-500">{ownerName}</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[report.status]}`}
          >
            {report.status.replace("_", " ")}
          </span>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 underline"
        >
          Back
        </button>
      </div>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Manager review panel — this is the "Manager review page" functionality,
          surfaced directly on the detail view a manager already lands on from
          the dashboard, rather than a separate near-duplicate page. */}
      {canReview && (
        <section className="rounded border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-medium text-blue-900">Review this report</h2>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Comment (required if requesting changes)"
            rows={3}
            className="mt-3 w-full rounded border px-3 py-2 text-sm"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => handleReview("APPROVED")}
              disabled={reviewing}
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleReview("CHANGES_REQUESTED")}
              disabled={reviewing}
              className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Request Changes
            </button>
          </div>
        </section>
      )}

      <section className="rounded border bg-white p-5">
        <TaskTable
          title="Tasks Completed"
          tasks={report.content.tasksCompleted}
          onChange={() => {}}
          readOnly
        />
      </section>

      <section className="rounded border bg-white p-5">
        <TaskTable
          title="Tasks Planned for Next Week"
          tasks={report.content.tasksPlannedNextWeek}
          onChange={() => {}}
          readOnly
        />
      </section>

      <section className="grid gap-6 rounded border bg-white p-5 md:grid-cols-2">
        <NoteList
          title="Blockers / Challenges"
          keyLabel="Key issue"
          notes={report.content.blockers}
          onChange={() => {}}
          readOnly
        />
        <NoteList
          title="Achievements / Highlights"
          keyLabel="Key achievement"
          notes={report.content.achievements}
          onChange={() => {}}
          readOnly
        />
      </section>

      <section className="rounded border bg-white p-5">
        <HoursEditor
          hours={report.content.hoursByType}
          onChange={() => {}}
          readOnly
        />
      </section>

      {report.content.notes && (
        <section className="rounded border bg-white p-5">
          <h3 className="mb-2 font-medium">Notes</h3>
          <p className="text-sm text-slate-700">{report.content.notes}</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Version &amp; Review History
        </h2>
        <ReviewTimeline versions={report.versions} reviews={report.reviews} />
      </section>
    </div>
  );
}
