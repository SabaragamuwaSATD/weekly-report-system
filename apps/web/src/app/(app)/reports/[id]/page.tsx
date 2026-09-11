"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchReport, updateReport, submitReport } from "@/lib/reports-api";
import type { Report, ReportContent } from "@/types/report";
import { EMPTY_CONTENT } from "@/types/report";
import { ApiError } from "@/lib/api";
import TaskTable from "@/components/reports/task-table";
import NoteList from "@/components/reports/note-list";
import HoursEditor from "@/components/reports/hours-editor";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  NEEDS_CORRECTION: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
};

export default function ReportEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [content, setContent] = useState<ReportContent>(EMPTY_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReport(id);
        setReport(data);
        setContent(data.content ?? EMPTY_CONTENT);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const isEditable =
    report?.status === "DRAFT" || report?.status === "NEEDS_CORRECTION";

  // This edit page is only meant for reports that can actually be edited —
  // anything else (Submitted/Approved) belongs on the read-only detail page.
  useEffect(() => {
    if (report && !isEditable) {
      router.replace(`/reports/${id}/view`);
    }
  }, [report, isEditable, id, router]);

  async function handleSave() {
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      const updated = await updateReport(id, content);
      setReport(updated);
      setSavedMessage("Draft saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (
      !confirm(
        "Submit this report for manager review? You will not be able to edit it until reviewed.",
      )
    ) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // Save whatever's currently in the form first, so nothing typed is lost
      await updateReport(id, content);
      const updated = await submitReport(id);
      setReport(updated);
      setContent(updated.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!report)
    return <p className="text-sm text-red-600">{error ?? "Report not found"}</p>;
  if (!isEditable) return <p className="text-sm text-slate-500">Redirecting…</p>;

  const projectName =
    typeof report.project === "string" ? report.project : report.project.name;
  const latestComment = [...report.reviews]
    .reverse()
    .find((r) => r.action === "CHANGES_REQUESTED");

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Week of {new Date(report.weekStart).toLocaleDateString()} —{" "}
            {projectName}
          </h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[report.status]}`}
          >
            {report.status.replace("_", " ")}
          </span>
        </div>
        <button
          onClick={() => router.push("/reports")}
          className="text-sm text-slate-500 underline"
        >
          Back to my reports
        </button>
      </div>

      {report.status === "NEEDS_CORRECTION" && latestComment && (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Manager requested changes:</p>
          <p className="mt-1">{latestComment.comment}</p>
        </div>
      )}

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      {savedMessage && (
        <p className="rounded bg-green-50 p-3 text-sm text-green-700">
          {savedMessage}
        </p>
      )}

      {!isEditable && (
        <p className="rounded bg-slate-100 p-3 text-sm text-slate-600">
          This report is {report.status.toLowerCase().replace("_", " ")} and
          is read-only.
        </p>
      )}

      <section className="space-y-4 rounded border bg-white p-5">
        <TaskTable
          title="Tasks Completed"
          tasks={content.tasksCompleted}
          onChange={(tasksCompleted) =>
            setContent({ ...content, tasksCompleted })
          }
          readOnly={!isEditable}
        />
      </section>

      <section className="space-y-4 rounded border bg-white p-5">
        <TaskTable
          title="Tasks Planned for Next Week"
          tasks={content.tasksPlannedNextWeek}
          onChange={(tasksPlannedNextWeek) =>
            setContent({ ...content, tasksPlannedNextWeek })
          }
          readOnly={!isEditable}
        />
      </section>

      <section className="grid gap-6 rounded border bg-white p-5 md:grid-cols-2">
        <NoteList
          title="Blockers / Challenges"
          keyLabel="Key issue"
          notes={content.blockers}
          onChange={(blockers) => setContent({ ...content, blockers })}
          readOnly={!isEditable}
        />
        <NoteList
          title="Achievements / Highlights"
          keyLabel="Key achievement"
          notes={content.achievements}
          onChange={(achievements) => setContent({ ...content, achievements })}
          readOnly={!isEditable}
        />
      </section>

      <section className="rounded border bg-white p-5">
        <HoursEditor
          hours={content.hoursByType}
          onChange={(hoursByType) => setContent({ ...content, hoursByType })}
          readOnly={!isEditable}
        />
      </section>

      <section className="rounded border bg-white p-5">
        <h3 className="mb-2 font-medium">Notes / Links (optional)</h3>
        <textarea
          disabled={!isEditable}
          rows={3}
          value={content.notes ?? ""}
          onChange={(e) => setContent({ ...content, notes: e.target.value })}
          className="w-full rounded border px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </section>

      {isEditable && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || submitting}
            className="rounded border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || submitting}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      )}
    </div>
  );
}
