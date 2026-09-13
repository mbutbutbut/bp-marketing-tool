"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OUTPUT_PRESETS, OUTPUT_TYPE_ORDER } from "@/lib/output-sizes";

export default function AddVariantForm({
  templateId,
  sourceVariantId,
}: {
  templateId: string;
  sourceVariantId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [outputType, setOutputType] = useState<string>(OUTPUT_TYPE_ORDER[0]);
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = OUTPUT_PRESETS[outputType];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/templates/${templateId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outputType,
        sourceVariantId,
        ...(preset
          ? {}
          : {
              widthPx: Number(customWidth),
              heightPx: Number(customHeight),
            }),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/app/templates/${templateId}/edit/${data.variantId}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        + Add size
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          Add a size variant
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          Cancel
        </button>
      </div>

      <label className="mb-1 block text-xs font-medium text-zinc-700">
        Output
      </label>
      <select
        value={outputType}
        onChange={(e) => setOutputType(e.target.value)}
        className="mb-3 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
      >
        {OUTPUT_TYPE_ORDER.map((type) => (
          <option key={type} value={type}>
            {OUTPUT_PRESETS[type]?.label ?? "Custom size"}
          </option>
        ))}
      </select>

      {preset ? (
        <p className="mb-3 text-xs text-zinc-500">
          {preset.widthPx}×{preset.heightPx}px{" "}
          {preset.dpi !== 72 && `@ ${preset.dpi} DPI`}
        </p>
      ) : (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Width (px)
            </label>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Height (px)
            </label>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create & open editor"}
      </button>
    </form>
  );
}
