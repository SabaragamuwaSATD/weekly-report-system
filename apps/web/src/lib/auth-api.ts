import { apiFetch } from "./api";
import type { CurrentUser } from "@/types/auth";

export function login(email: string, password: string) {
  return apiFetch<{ id: string; name: string; email: string; role: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
}

export function register(name: string, email: string, password: string) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return apiFetch<CurrentUser>("/auth/me");
}
