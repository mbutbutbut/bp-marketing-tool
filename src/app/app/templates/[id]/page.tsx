import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FieldList from "./field-list";
import AddVariantForm from "./add-variant-form";
import PublishToggle from "./publish-toggle";
import Card from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";

interface CanvasJsonField {
  fieldKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: string;
  defaultValue: string;
}

interface CanvasJson {
  backgroundImageUrl: string | null;
  backgroundFill: string | null;
  width: number;
  height: number;
  fields: CanvasJsonField[];
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      fields: true,
      renders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { createdBy: true, variant: true },
      },
    },
  });

  if (!template) {
    notFound();
  }

  const variant = template.variants[0];
  const canvasJson = variant?.canvasJson as unknown as CanvasJson | undefined;
  const primaryFields = template.fields.filter(
    (f) => f.variantId === variant?.id,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            {template.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {canvasJson
              ? `${canvasJson.width}×${canvasJson.height}px · ${primaryFields.filter((f) => f.isEditable).length} editable field${primaryFields.filter((f) => f.isEditable).length === 1 ? "" : "s"}`
              : "No size variant yet."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PublishToggle templateId={template.id} initialStatus={template.status} />
          {canvasJson && variant && (
            <Link
              href={`/app/templates/${template.id}/edit/${variant.id}`}
              className={buttonClasses("primary")}
            >
              Open editor
            </Link>
          )}
        </div>
      </div>

      {!canvasJson ? (
        <p className="text-sm text-zinc-500">
          Something went wrong importing this template.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white"
              style={{
                aspectRatio: `${canvasJson.width} / ${canvasJson.height}`,
                backgroundColor: canvasJson.backgroundFill ?? "#f4f4f5",
              }}
            >
              {canvasJson.backgroundImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={canvasJson.backgroundImageUrl}
                  alt={template.name}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}
            </div>

            <div>
              <h2 className="mb-1 text-sm font-semibold text-zinc-900">
                Fields found in this frame
              </h2>
              <p className="mb-3 text-xs text-zinc-500">
                Uncheck anything that shouldn&apos;t change per event (like a
                logo) — content managers will only see checked fields.
              </p>
              <FieldList
                initialFields={primaryFields.map((f) => ({
                  id: f.id,
                  label: f.label,
                  defaultValue: f.defaultValue,
                  fontFamily: f.fontFamily,
                  fontSize: f.fontSize,
                  isEditable: f.isEditable,
                }))}
              />
              <p className="mt-4 text-xs text-zinc-500">
                Open the editor to move/resize fields, change fonts, or edit
                the default text.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Sizes</h2>
              {variant && (
                <AddVariantForm
                  templateId={template.id}
                  sourceVariantId={variant.id}
                />
              )}
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {template.variants.map((v) => (
                <li key={v.id}>
                  <Card>
                    <p className="text-sm font-medium text-zinc-900">
                      {v.label}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {v.widthPx}×{v.heightPx}px
                      {v.dpi !== 72 && ` · ${v.dpi} DPI`}
                    </p>
                    <Link
                      href={`/app/templates/${template.id}/edit/${v.id}`}
                      className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
                    >
                      Open editor →
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">
              Recent exports
            </h2>
            {template.renders.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No exports yet — they&apos;ll show up here once someone
                downloads a PNG, JPG, or PDF from the editor or fill page.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
                {template.renders.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="text-zinc-700">
                      {r.format} · {r.variant.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {r.createdBy.name} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
