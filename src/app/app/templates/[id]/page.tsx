import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
            ? `${canvasJson.width}×${canvasJson.height}px · ${template.fields.length} editable field${template.fields.length === 1 ? "" : "s"}`
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
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">
              Fields found in this frame
            </h2>
            {template.fields.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No text layers were found in this frame — this template will
                only support swapping the background image.
              </p>
            ) : (
              <ul className="space-y-2">
                {template.fields.map((field) => (
                  <li
                    key={field.id}
                    className="rounded-md border border-zinc-200 bg-white p-3"
                  >
                    <p className="text-sm font-medium text-zinc-900">
                      {field.label}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Default: &quot;{field.defaultValue}&quot; ·{" "}
                      {field.fontFamily} {field.fontSize}px
                    </p>
                  </li>
                ))}
              </ul>
            )}
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
