"use client";

import type { NoteEntry } from "@/types/report";

export default function NoteList({
  title,
  keyLabel,
  notes,
  onChange,
  readOnly,
}: {
  title: string;
  keyLabel: string; // e.g. "Key issue" or "Key achievement"
  notes: NoteEntry[];
  onChange: (notes: NoteEntry[]) => void;
  readOnly?: boolean;
}) {
  function update(index: number, patch: Partial<NoteEntry>) {
    onChange(notes.map((n, i) => (i === index ? { ...n, ...patch } : n)));
  }

  // Radio-button semantics: setting one as key unsets every other one in
  // this array — this is what makes the backend's "at most one key" rule
  // impossible to violate from the UI in the first place.
  function setKey(index: number) {
    onChange(notes.map((n, i) => ({ ...n, isKey: i === index })));
  }

  function remove(index: number) {
    onChange(notes.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...notes, { text: "", isKey: false }]);
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
            + Add
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-slate-400">None added.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <div key={i} className="flex items-start gap-3 rounded border p-2">
              <textarea
                required
                disabled={readOnly}
                value={note.text}
                onChange={(e) => update(i, { text: e.target.value })}
                rows={2}
                className="flex-1 rounded border px-2 py-1 text-sm disabled:bg-slate-50"
              />
              <label className="flex shrink-0 items-center gap-1 pt-1 text-xs text-slate-600">
                <input
                  type="radio"
                  name={`${title}-key`}
                  disabled={readOnly}
                  checked={!!note.isKey}
                  onChange={() => setKey(i)}
                />
                {keyLabel}
              </label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="pt-1 text-xs text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
