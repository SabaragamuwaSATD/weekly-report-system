import type { Report } from "@/types/report";

export function tasksCompletedTrend(reports: Report[]) {
  // One point per week, summed across whatever's currently filtered
  // (a single person if owner-filtered, whole team otherwise)
  const byWeek = new Map<string, number>();
  for (const r of reports) {
    const week = new Date(r.weekStart).toISOString().slice(0, 10);
    const count = r.content.tasksCompleted.length;
    byWeek.set(week, (byWeek.get(week) ?? 0) + count);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, tasksCompleted: count }));
}

export interface StatusByMemberRow {
  name: string;
  DRAFT: number;
  SUBMITTED: number;
  NEEDS_CORRECTION: number;
  APPROVED: number;
}

export function statusByMember(reports: Report[]): StatusByMemberRow[] {
  const byMember = new Map<string, StatusByMemberRow>();
  for (const r of reports) {
    const name = typeof r.owner === "string" ? r.owner : r.owner.name;
    if (!byMember.has(name)) {
      byMember.set(name, {
        name,
        DRAFT: 0,
        SUBMITTED: 0,
        NEEDS_CORRECTION: 0,
        APPROVED: 0,
      });
    }
    byMember.get(name)![r.status] += 1;
  }
  return [...byMember.values()];
}

export function workloadByProject(reports: Report[]) {
  const byProject = new Map<string, number>();
  for (const r of reports) {
    const name = typeof r.project === "string" ? r.project : r.project.name;
    const taskCount =
      r.content.tasksCompleted.length + r.content.tasksPlannedNextWeek.length;
    byProject.set(name, (byProject.get(name) ?? 0) + taskCount);
  }
  return [...byProject.entries()].map(([name, value]) => ({ name, value }));
}

export function timeByTaskType(reports: Report[]) {
  const totals = new Map<string, number>();
  for (const r of reports) {
    for (const [type, hours] of Object.entries(r.content.hoursByType ?? {})) {
      totals.set(type, (totals.get(type) ?? 0) + hours);
    }
  }
  return [...totals.entries()].map(([type, hours]) => ({ type, hours }));
}

export interface ActivityEvent {
  reportId: string;
  ownerName: string;
  action: string;
  comment?: string;
  at: string;
}

export function recentActivity(reports: Report[]): ActivityEvent[] {
  // Flatten every review action across every report into one feed,
  // most recent first — this is the "recent activity feed" requirement.
  const events: ActivityEvent[] = [];

  for (const r of reports) {
    const ownerName = typeof r.owner === "string" ? r.owner : r.owner.name;
    for (const review of r.reviews) {
      events.push({
        reportId: r._id,
        ownerName,
        action: review.action,
        comment: review.comment,
        at: review.reviewedAt,
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
}
