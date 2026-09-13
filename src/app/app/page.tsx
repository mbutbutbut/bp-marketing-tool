import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonClasses } from "@/components/ui/button";
import TemplateLibraryGrid from "./template-library-grid";
import type { PreviewCanvasJson } from "@/components/template-preview";
import type { Prisma } from "@/generated/prisma/client";

const STATUS_TABS = ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const activeTab = STATUS_TABS.includes(
    (status ?? "").toUpperCase() as (typeof STATUS_TABS)[number],
  )
    ? (status!.toUpperCase() as (typeof STATUS_TABS)[number])
    : "ALL";

  const where: Prisma.TemplateWhereInput = {};
  if (activeTab === "ALL") {
    where.status = { not: "ARCHIVED" };
  } else {
    where.status = activeTab;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { eventType: { contains: q, mode: "insensitive" } },
    ];
  }

  const templates = await prisma.template.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { variants: true },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Templates</h1>
        <Link href="/app/templates/new" className={buttonClasses("primary")}>
          Import from Figma
        </Link>
      </div>

      <form className="mb-4 flex items-center gap-3" action="/app" method="get">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or event type…"
          className="w-full max-w-xs rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
        />
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab}
              href={{
                pathname: "/app",
                query: {
                  ...(q ? { q } : {}),
                  ...(tab === "ALL" ? {} : { status: tab }),
                },
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                activeTab === tab
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </form>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">
          {q || activeTab !== "ALL"
            ? "No templates match this search."
            : "No templates yet. Import your first design from Figma to get started."}
        </div>
      ) : (
        <TemplateLibraryGrid
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            eventType: t.eventType,
            variantCount: t.variants.length,
            canvasJson:
              (t.variants[0]?.canvasJson as unknown as PreviewCanvasJson) ??
              null,
          }))}
        />
      )}
    </div>
  );
}
