import { apiFetch } from "./api";
import type { Project } from "@/types/project";

export function fetchProjects(includeInactive = false) {
  const query = includeInactive ? "?includeInactive=true" : "";
  return apiFetch<Project[]>(`/projects${query}`);
}

export function createProject(data: { name: string; description?: string }) {
  return apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProject(
  id: string,
  data: { name?: string; description?: string },
) {
  return apiFetch<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string) {
  return apiFetch<Project>(`/projects/${id}`, { method: "DELETE" });
}

export function reactivateProject(id: string) {
  return apiFetch<Project>(`/projects/${id}/reactivate`, { method: "PATCH" });
}
