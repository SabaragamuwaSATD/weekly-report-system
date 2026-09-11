import { apiFetch } from "./api";

export function askAssistant(question: string) {
  return apiFetch<{ answer: string }>("/assistant/ask", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
