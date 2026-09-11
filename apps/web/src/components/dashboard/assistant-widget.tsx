"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { askAssistant } from "@/lib/assistant-api";
import { ApiError } from "@/lib/api";

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await askAssistant(q);
      setMessages((m) => [...m, { role: "assistant", text: res.answer }]);
    } catch (err) {
      const text =
        err instanceof ApiError ? err.message : "Sorry, something went wrong.";
      setMessages((m) => [...m, { role: "assistant", text }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg"
      >
        Ask AI Assistant
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 flex h-[420px] w-80 flex-col rounded-lg border bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Team Assistant</span>
        <button onClick={() => setOpen(false)} className="text-slate-400">
          ✕
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400">
            Try: &quot;What did the team work on last week?&quot; or &quot;Any
            recurring blockers?&quot;
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-6 rounded bg-slate-900 p-2 text-sm text-white">
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              className="mr-6 space-y-1.5 rounded bg-slate-100 p-2 text-sm text-slate-800 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4"
            >
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
          ),
        )}
        {loading && <p className="text-xs text-slate-400">Thinking…</p>}
      </div>
      <form onSubmit={handleAsk} className="flex gap-2 border-t p-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about the team…"
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
