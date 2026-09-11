import { apiFetch } from "./api";
import type {
  Report,
  ReportContent,
  ReportVersion,
  ReviewEntry,
  ReportStatus,
} from "@/types/report";

interface ReportsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function fetchMyReports() {
  return apiFetch<{ data: Report[]; meta: ReportsMeta }>("/reports?limit=100");
}

export function fetchReport(id: string) {
  return apiFetch<Report>(`/reports/${id}`);
}

export function createReport(data: {
  weekStart: string;
  weekEnd: string;
  project: string;
}) {
  return apiFetch<Report>("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateReport(
  id: string,
  content: ReportContent,
  project?: string,
) {
  return apiFetch<Report>(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ content, ...(project ? { project } : {}) }),
  });
}

export function submitReport(id: string) {
  return apiFetch<Report>(`/reports/${id}/submit`, { method: "POST" });
}

export function fetchReportHistory(id: string) {
  return apiFetch<{
    currentStatus: ReportStatus;
    currentVersion: number;
    versions: ReportVersion[];
    reviews: ReviewEntry[];
  }>(`/reports/${id}/history`);
}

export interface ReportFilters {
  owner?: string;
  project?: string;
  status?: string;
  weekStart?: string;
  weekEnd?: string;
  page?: number;
  limit?: number;
}

export function fetchReports(filters: ReportFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return apiFetch<{ data: Report[]; meta: ReportsMeta }>(
    `/reports?${params.toString()}`,
  );
}

export function reviewReport(
  id: string,
  action: "APPROVED" | "CHANGES_REQUESTED",
  comment?: string,
) {
  return apiFetch<Report>(`/reports/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ action, comment }),
  });
}
