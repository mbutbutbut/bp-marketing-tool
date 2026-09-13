"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import TemplateCardActions from "./template-card-actions";
import TemplatePreview, {
  type PreviewCanvasJson,
} from "@/components/template-preview";

interface LibraryTemplate {
  id: string;
  name: string;
  status: string;
  eventType: string | null;
  variantCount: number;
  canvasJson: PreviewCanvasJson | null;
}

export default function TemplateLibraryGrid({
  templates,
}: {
  templates: LibraryTemplate[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  async function bulkSetStatus(nextStatus: "ARCHIVED" | "DRAFT") {
    if (
      nextStatus === "ARCHIVED" &&
      !window.confirm(
        `Archive ${selected.size} template${selected.size === 1 ? "" : "s"}? They will no longer be visible to content managers.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/templates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }),
      ),
    );
    setBulkLoading(false);
    clear();
    router.refresh();
  }

  const selectedTemplates = templates.filter((t) => selected.has(t.id));
  const allSelectedArchived =
    selectedTemplates.length > 0 &&
    selectedTemplates.every((t) => t.status === "ARCHIVED");

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2.5">
          <p className="text-sm font-medium text-zinc-700">
            {selected.size} selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                bulkSetStatus(allSelectedArchived ? "DRAFT" : "ARCHIVED")
              }
              disabled={bulkLoading}
            >
              {bulkLoading
                ? "Working…"
                : allSelectedArchived
                  ? "Unarchive"
                  : "Archive"}
            </Button>
            <button
              onClick={clear}
              disabled={bulkLoading}
              className="text-sm text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {templates.map((t) => (
          <li key={t.id}>
            <Card className="relative">
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggle(t.id)}
                aria-label={`Select ${t.name}`}
                className="absolute right-3 top-3 z-10 h-4 w-4 rounded border-zinc-300"
              />
              <Link href={`/app/templates/${t.id}`} className="block">
                <TemplatePreview
                  id={t.id}
                  canvasJson={t.canvasJson}
                  alt={t.name}
                />
                <p className="mt-3 font-medium text-zinc-900">{t.name}</p>
                <p className="text-xs uppercase text-zinc-500">
                  {t.status}
                  {t.eventType ? ` · ${t.eventType}` : ""}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {t.variantCount} size variant
                  {t.variantCount === 1 ? "" : "s"}
                </p>
              </Link>
              <TemplateCardActions templateId={t.id} status={t.status} />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
