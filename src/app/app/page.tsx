import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
    include: { variants: true },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Templates</h1>
        <Link
          href="/app/templates/new"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Import from Figma
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">
          No templates yet. Import your first design from Figma to get
          started.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {templates.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <p className="font-medium text-zinc-900">{t.name}</p>
              <p className="text-xs uppercase text-zinc-500">{t.status}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {t.variants.length} size variant
                {t.variants.length === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
