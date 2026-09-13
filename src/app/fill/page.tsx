import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function FillPage() {
  const templates = await prisma.template.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    include: { variants: true },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-lg font-semibold text-zinc-900">
        Pick a template
      </h1>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">
          No published templates yet. Ask the owner to publish one.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {templates.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <p className="font-medium text-zinc-900">{t.name}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {t.variants.length} size option
                {t.variants.length === 1 ? "" : "s"}
              </p>
              <Link
                href={`/fill/${t.id}`}
                className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
              >
                Fill in content →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
