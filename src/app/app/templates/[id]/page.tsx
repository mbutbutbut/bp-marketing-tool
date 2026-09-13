import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FieldList from "./field-list";

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
    include: { variants: true, fields: true },
  });

  if (!template) {
    notFound();
  }

  const variant = template.variants[0];
  const canvasJson = variant?.canvasJson as unknown as CanvasJson | undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-900">
          {template.name}
        </h1>
        <p className="text-sm text-zinc-500">
          {canvasJson
            ? `${canvasJson.width}×${canvasJson.height}px · ${template.fields.filter((f) => f.isEditable).length} editable field${template.fields.filter((f) => f.isEditable).length === 1 ? "" : "s"}`
            : "No size variant yet."}
        </p>
      </div>

      {!canvasJson ? (
        <p className="text-sm text-zinc-500">
          Something went wrong importing this template.
        </p>
      ) : (
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
              initialFields={template.fields.map((f) => ({
                id: f.id,
                label: f.label,
                defaultValue: f.defaultValue,
                fontFamily: f.fontFamily,
                fontSize: f.fontSize,
                isEditable: f.isEditable,
              }))}
            />
            <p className="mt-4 text-xs text-zinc-400">
              This is a preview of what came in from Figma. Full editing
              (moving/resizing fields, adjusting fonts, adding size variants)
              is coming next.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
