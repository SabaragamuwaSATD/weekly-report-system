# ER Diagram — Weekly Report System

This is a MongoDB/Mongoose schema, not a relational database, so there are no
foreign key constraints at the database level. This diagram distinguishes
between two relationship types:

- **Reference relationships** (`owner`, `project`, `createdBy`, `reviewedBy`) — a
  `Types.ObjectId` stored on one document that points at another document in a
  *separate* collection, resolved at query time via `.populate()`.
- **Embedded relationships** (`content`, `versions`, `reviews`, and the shapes
  nested inside them) — sub-documents stored *directly inside* the parent
  document, with no separate collection or `_id` of their own (`{ _id: false }`
  schemas). These only exist as part of their parent and are never queried
  independently.

## Collections and embedded shapes

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role "TEAM_MEMBER | MANAGER"
        boolean isActive
        date createdAt
        date updatedAt
    }

    PROJECTS {
        ObjectId _id PK
        string name UK
        string description
        boolean isActive
        ObjectId createdBy FK
        date createdAt
        date updatedAt
    }

    REPORTS {
        ObjectId _id PK
        ObjectId owner FK
        ObjectId project FK
        date weekStart
        date weekEnd
        string status "DRAFT | SUBMITTED | NEEDS_CORRECTION | APPROVED"
        number currentVersion
        date createdAt
        date updatedAt
    }

    REPORT_CONTENT {
        TaskEntry_array tasksCompleted "embedded, no _id"
        TaskEntry_array tasksPlannedNextWeek "embedded, no _id"
        NoteEntry_array blockers "embedded, no _id"
        NoteEntry_array achievements "embedded, no _id"
        Map hoursByType "string to number"
        string notes
    }

    TASK_ENTRY {
        string taskName
        string priority "LOW | MEDIUM | HIGH"
        number plannedPercent
        number actualPercent
        string status "NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED"
        number timePlannedHours
        number timeSpentHours
        string output
    }

    NOTE_ENTRY {
        string text
        boolean isKey "at most one true per array, enforced in service layer"
    }

    REPORT_VERSION {
        number versionNumber
        date submittedAt
    }

    REVIEW_ENTRY {
        number versionNumber "which version this review is about"
        string action "APPROVED | CHANGES_REQUESTED"
        string comment "required when CHANGES_REQUESTED"
        ObjectId reviewedBy FK
        date reviewedAt
    }

    USERS ||--o{ PROJECTS : "createdBy"
    USERS ||--o{ REPORTS : "owner"
    PROJECTS ||--o{ REPORTS : "project"
    USERS ||--o{ REVIEW_ENTRY : "reviewedBy"

    REPORTS ||--|| REPORT_CONTENT : "content (live draft, embedded)"
    REPORTS ||--o{ REPORT_VERSION : "versions[] (frozen snapshots, embedded)"
    REPORTS ||--o{ REVIEW_ENTRY : "reviews[] (embedded)"
    REPORT_VERSION ||--|| REPORT_CONTENT : "content (frozen snapshot, embedded)"
    REPORT_CONTENT ||--o{ TASK_ENTRY : "tasksCompleted / tasksPlannedNextWeek"
    REPORT_CONTENT ||--o{ NOTE_ENTRY : "blockers / achievements"
```

## Design notes (why embed vs. reference)

- **`content`/`versions`/`reviews` are embedded, not referenced.** A report's
  content is never queried or displayed independently of its parent report —
  there's no use case for "find all `NoteEntry` documents across all reports."
  Embedding keeps a full report (current draft + every past version + every
  review) retrievable in a single `findById`, with no joins.
- **`owner`, `project`, `createdBy`, `reviewedBy` are references**, because
  `User` and `Project` documents *are* independently queried (`GET /users`,
  `GET /projects`), have their own lifecycle (a project can be soft-deleted
  independently of any report that references it), and are shared across many
  reports — embedding a full user/project into every report would duplicate
  data and make renaming a project or updating a user's name require rewriting
  every report that references them.
- **`Report.content` vs. `Report.versions[].content`**: both use the exact
  same `ReportContentSchema`. `content` is the *live, editable draft* a team
  member works on while `DRAFT`/`NEEDS_CORRECTION`; each `versions[]` entry is
  an *immutable snapshot* of `content` taken at the moment of a submit. This
  is what makes the version-history requirement work — old snapshots are never
  mutated, only ever appended to.
- **The one-report-per-person-per-week rule** is enforced by a compound unique
  index on `reports`: `{ owner: 1, weekStart: 1 }`.
