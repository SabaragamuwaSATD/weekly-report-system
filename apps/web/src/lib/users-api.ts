import { apiFetch } from "./api";
import type { UserSummary } from "@/types/user";

export function fetchTeamMembers() {
  return apiFetch<UserSummary[]>("/users");
}

export function fetchUser(id: string) {
  return apiFetch<UserSummary>(`/users/${id}`);
}
