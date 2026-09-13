"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TemplateCardActions({
  templateId,
  status,
}: {
  templateId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function duplicate() {
    setLoading("duplicate");
    const res = await fetch(`/api/templates/${templateId}/duplicate`, {
      method: "POST",
    });
    setLoading(null);
    if (res.ok) {
      const data = await res.json();
      router.push(`/app/templates/${data.templateId}`);
    }
  }

  async function toggleArchive() {
    const nextStatus = status === "ARCHIVED" ? "DRAFT" : "ARCHIVED";
    if (
      nextStatus === "ARCHIVED" &&
      !window.confirm(
        "Archive this template? It will no longer be visible to content managers.",
      )
    ) {
      return;
    }
    setLoading("archive");
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-3 flex gap-3 text-xs">
      <button
        onClick={duplicate}
        disabled={loading !== null}
        className="text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
      >
        {loading === "duplicate" ? "Duplicating…" : "Duplicate"}
      </button>
      <button
        onClick={toggleArchive}
        disabled={loading !== null}
        className="text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
      >
        {status === "ARCHIVED"
          ? "Unarchive"
          : loading === "archive"
            ? "Archiving…"
            : "Archive"}
      </button>
    </div>
  );
}
