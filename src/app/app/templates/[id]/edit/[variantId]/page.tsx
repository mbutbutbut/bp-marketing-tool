import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TemplateEditor from "../editor";

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  const { id, variantId } = await params;

  const template = await prisma.template.findUnique({
    where: { id },
    include: { fields: true },
  });

  if (!template) {
    notFound();
  }

  const variant = await prisma.templateVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant || variant.templateId !== template.id) {
    notFound();
  }

  const editableFieldKeys = new Set(
    template.fields
      .filter((f) => f.variantId === variant.id && f.isEditable)
      .map((f) => f.fieldKey),
  );

  return (
    <TemplateEditor
      templateId={template.id}
      templateName={template.name}
      variantId={variant.id}
      variantLabel={variant.label}
      canvasJson={variant.canvasJson}
      editableFieldKeys={Array.from(editableFieldKeys)}
    />
  );
}
