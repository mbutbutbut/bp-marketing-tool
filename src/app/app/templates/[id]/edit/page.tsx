import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TemplateEditor from "./editor";

export default async function TemplateEditPage({
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
  if (!variant) {
    notFound();
  }

  const editableFieldKeys = new Set(
    template.fields.filter((f) => f.isEditable).map((f) => f.fieldKey),
  );

  return (
    <TemplateEditor
      templateId={template.id}
      templateName={template.name}
      variantId={variant.id}
      canvasJson={variant.canvasJson}
      editableFieldKeys={Array.from(editableFieldKeys)}
    />
  );
}
