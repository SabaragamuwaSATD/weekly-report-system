"use client";

import { useState } from "react";
import { HOUR_TYPE_SUGGESTIONS } from "@/types/report";

export default function HoursEditor({
  hours,
  onChange,
  readOnly,
}: {
  hours: Record<string, number>;
  onChange: (hours: Record<string, number>) => void;
  readOnly?: boolean;
}) {
  const [newType, setNewType] = useState("");
  const entries = Object.entries(hours);

  function setValue(type: string, value: number) {
    onChange({ ...hours, [type]: value });
  }

  function remove(type: string) {
    const next = { ...hours };
    delete next[type];
    onChange(next);
  }

  function addType(type: string) {
    if (!type.trim() || hours[type] !== undefined) return;
    onChange({ ...hours, [type]: 0 });
    setNewType("");
  }

  const availableSuggestions = HOUR_TYPE_SUGGESTIONS.filter(
    (s) => hours[s] === undefined,
  );

  return (
    <div>
      <h3 className="mb-2 font-medium">Hours by task type (optional)</h3>
      <div className="space-y-2">
        {entries.map(([type, value]) => (
          <div key={type} className="flex items-center gap-3">
            <span className="w-40 text-sm">{type}</span>
            <input
              type="number"
              min={0}
              step={0.5}
              disabled={readOnly}
              value={value}
              onChange={(e) => setValue(type, Number(e.target.value))}
              className="w-24 rounded border px-2 py-1 text-sm disabled:bg-slate-50"
            />
            <span className="text-sm text-slate-400">hrs</span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => remove(type)}
                className="text-xs text-red-600"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addType(s)}
              className="rounded-full border px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              + {s}
            </button>
          ))}
          <input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Custom category"
            className="rounded border px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => addType(newType)}
            className="text-xs text-slate-900 underline"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
