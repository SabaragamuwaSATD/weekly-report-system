"use client";

import { useEffect, useState } from "react";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  reactivateProject,
} from "@/lib/projects-api";
import type { Project } from "@/types/project";
import { ApiError } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Which project is currently being edited inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects(showInactive);
      setProjects(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load projects",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchProjects(showInactive)
      .then((data) => {
        if (cancelled) return;
        setProjects(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Failed to load projects",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showInactive]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createProject({
        name: newName,
        description: newDescription || undefined,
      });
      setNewName("");
      setNewDescription("");
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create project",
      );
    } finally {
      setCreating(false);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project._id);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      await updateProject(id, {
        name: editName,
        description: editDescription || undefined,
      });
      setEditingId(null);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update project",
      );
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Deactivate this project? Existing reports will keep it, but it will no longer appear in new report forms.",
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteProject(id);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to deactivate project",
      );
    }
  }

  async function handleReactivate(id: string) {
    setError(null);
    try {
      await reactivateProject(id);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to reactivate project",
      );
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-slate-500">
          Manage the project/category tags used across weekly reports.
        </p>
      </div>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded border bg-white p-4"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium">Name</label>
          <input
            required
            minLength={2}
            maxLength={100}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g. Client A"
          />
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="block text-sm font-medium">
            Description (optional)
          </label>
          <input
            maxLength={500}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="Short description"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {creating ? "Adding…" : "Add project"}
        </button>
      </form>

      {/* Toggle inactive */}
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />
        Show deactivated projects
      </label>

      {/* List */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-slate-500">No projects yet.</p>
      ) : (
        <div className="overflow-hidden rounded border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project._id} className="border-t">
                  {editingId === project._id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded border px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded border px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-2 text-slate-400">—</td>
                      <td className="px-4 py-2 space-x-3">
                        <button
                          onClick={() => saveEdit(project._id)}
                          className="text-slate-900 underline"
                        >
                          Save
                        </button>
                        <button onClick={cancelEdit} className="text-slate-500">
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-medium">{project.name}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {project.description || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            project.isActive
                              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                              : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                          }
                        >
                          {project.isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-4 py-2 space-x-3">
                        <button
                          onClick={() => startEdit(project)}
                          className="text-slate-900 underline"
                        >
                          Edit
                        </button>
                        {project.isActive ? (
                          <button
                            onClick={() => handleDelete(project._id)}
                            className="text-red-600 underline"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(project._id)}
                            className="text-green-700 underline"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </>
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
