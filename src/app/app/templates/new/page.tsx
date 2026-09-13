"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/templates/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, figmaUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push(`/app/templates/${data.templateId}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-lg font-semibold text-zinc-900">
        Import from Figma
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Select a frame in Figma, choose &quot;Copy link to selection,&quot;
        and paste it below.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-6"
      >
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Template name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekly Comp Night Poster"
          className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Figma frame link
        </label>
        <input
          required
          type="url"
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          placeholder="https://www.figma.com/design/...?node-id=..."
          className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Importing…" : "Import template"}
        </Button>
      </form>
    </div>
  );
}
