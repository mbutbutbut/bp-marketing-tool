"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishToggle({
  templateId,
  initialStatus,
}: {
  templateId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const nextStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setLoading(true);
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(false);
    if (res.ok) {
      setStatus(nextStatus);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
        status === "PUBLISHED"
          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
          : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {status === "PUBLISHED"
        ? "Published — visible to content managers"
        : "Draft — publish to content managers"}
    </button>
  );
}
