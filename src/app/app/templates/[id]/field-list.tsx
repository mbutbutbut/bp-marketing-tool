"use client";

import { useState } from "react";

interface FieldItem {
  id: string;
  label: string;
  defaultValue: string | null;
  fontFamily: string | null;
  fontSize: number | null;
  isEditable: boolean;
}

export default function FieldList({
  initialFields,
}: {
  initialFields: FieldItem[];
}) {
  const [fields, setFields] = useState(initialFields);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggle(field: FieldItem) {
    const nextValue = !field.isEditable;
    setPendingId(field.id);
    setFields((prev) =>
      prev.map((f) =>
        f.id === field.id ? { ...f, isEditable: nextValue } : f,
      ),
    );

    const res = await fetch(`/api/templates/fields/${field.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEditable: nextValue }),
    });

    if (!res.ok) {
      // Revert on failure.
      setFields((prev) =>
        prev.map((f) =>
          f.id === field.id ? { ...f, isEditable: field.isEditable } : f,
        ),
      );
    }

    setPendingId(null);
  }

  if (fields.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No text layers were found in this frame — this template will only
        support swapping the background image.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {fields.map((field) => (
        <li
          key={field.id}
          className="flex items-start gap-3 rounded-md border border-zinc-200 bg-white p-3"
        >
          <input
            type="checkbox"
            checked={field.isEditable}
            disabled={pendingId === field.id}
            onChange={() => toggle(field)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {field.label}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Default: &quot;{field.defaultValue}&quot; · {field.fontFamily}{" "}
              {field.fontSize}px
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {field.isEditable
                ? "Editable — content managers can change this."
                : "Locked — stays part of the background, not shown to content managers."}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
