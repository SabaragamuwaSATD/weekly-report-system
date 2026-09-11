"use client";

import type { TaskEntry, TaskPriority, TaskStatus } from "@/types/report";

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];
const STATUSES: TaskStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
];

const EMPTY_TASK: TaskEntry = {
  taskName: "",
  priority: "MEDIUM",
  plannedPercent: 0,
  actualPercent: 0,
  status: "NOT_STARTED",
  timePlannedHours: 0,
  timeSpentHours: 0,
  output: "",
};

export default function TaskTable({
  title,
  tasks,
  onChange,
  readOnly,
}: {
  title: string;
  tasks: TaskEntry[];
  onChange: (tasks: TaskEntry[]) => void;
  readOnly?: boolean;
}) {
  function update(index: number, patch: Partial<TaskEntry>) {
    onChange(tasks.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function remove(index: number) {
    onChange(tasks.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...tasks, { ...EMPTY_TASK }]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={add}
            className="text-sm text-slate-900 underline"
          >
            + Add task
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400">No tasks added.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Planned %</th>
                <th className="px-3 py-2">Actual %</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Hrs planned</th>
                <th className="px-3 py-2">Hrs spent</th>
                <th className="px-3 py-2">Output</th>
                {!readOnly && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-1.5">
                    <input
                      required
                      disabled={readOnly}
                      value={task.taskName}
                      onChange={(e) => update(i, { taskName: e.target.value })}
                      className="w-40 rounded border px-2 py-1 disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      disabled={readOnly}
                      value={task.priority}
                      onChange={(e) =>
                        update(i, { priority: e.target.value as TaskPriority })
                      }
                      className="rounded border px-2 py-1 disabled:bg-slate-50"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={readOnly}
                      value={task.plannedPercent}
                      onChange={(e) =>
                        update(i, { plannedPercent: Number(e.target.value) })
                      }
                      className="w-16 rounded border px-2 py-1 disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={readOnly}
                      value={task.actualPercent}
                      onChange={(e) =>
                        update(i, { actualPercent: Number(e.target.value) })
                      }
                      className="w-16 rounded border px-2 py-1 disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      disabled={readOnly}
                      value={task.status}
                      onChange={(e) =>
                        update(i, { status: e.target.value as TaskStatus })
                      }
                      className="rounded border px-2 py-1 disabled:bg-slate-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      disabled={readOnly}
                      value={task.timePlannedHours}
                      onChange={(e) =>
                        update(i, {
                          timePlannedHours: Number(e.target.value),
                        })
                      }
                      className="w-16 rounded border px-2 py-1 disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      disabled={readOnly}
                      value={task.timeSpentHours}
                      onChange={(e) =>
                        update(i, { timeSpentHours: Number(e.target.value) })
                      }
                      className="w-16 rounded border px-2 py-1 disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      disabled={readOnly}
                      value={task.output ?? ""}
                      onChange={(e) => update(i, { output: e.target.value })}
                      className="w-40 rounded border px-2 py-1 disabled:bg-slate-50"
                    />
                  </td>
                  {!readOnly && (
                    <td className="px-3 py-1.5">
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
