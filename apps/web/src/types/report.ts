export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED";
export type ReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "NEEDS_CORRECTION"
  | "APPROVED";
export type ReviewAction = "APPROVED" | "CHANGES_REQUESTED";

export interface TaskEntry {
  taskName: string;
  priority: TaskPriority;
  plannedPercent: number;
  actualPercent: number;
  status: TaskStatus;
  timePlannedHours: number;
  timeSpentHours: number;
  output?: string;
}

export interface NoteEntry {
  text: string;
  isKey?: boolean;
}

export interface ReportContent {
  tasksCompleted: TaskEntry[];
  tasksPlannedNextWeek: TaskEntry[];
  blockers: NoteEntry[];
  achievements: NoteEntry[];
  hoursByType: Record<string, number>;
  notes?: string;
}

export interface ReviewEntry {
  versionNumber: number;
  action: ReviewAction;
  comment?: string;
  reviewedBy: { _id: string; name: string; email: string } | string;
  reviewedAt: string;
}

export interface ReportVersion {
  versionNumber: number;
  content: ReportContent;
  submittedAt: string;
}

export interface Report {
  _id: string;
  owner: { _id: string; name: string; email: string } | string;
  project: { _id: string; name: string } | string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  currentVersion: number;
  content: ReportContent;
  versions: ReportVersion[];
  reviews: ReviewEntry[];
  createdAt: string;
  updatedAt: string;
}

export const EMPTY_CONTENT: ReportContent = {
  tasksCompleted: [],
  tasksPlannedNextWeek: [],
  blockers: [],
  achievements: [],
  hoursByType: {},
  notes: "",
};

export const HOUR_TYPE_SUGGESTIONS = [
  "Development",
  "Testing",
  "Meetings",
  "Documentation",
];
