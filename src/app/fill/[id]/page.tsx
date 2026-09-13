import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import FillEditor from "./fill-editor";

export default async function FillTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      fields: true,
    },
  });

  if (!template) {
    notFound();
  }

  // Editors may only fill published templates; Owners can preview drafts too.
  if (template.status !== "PUBLISHED" && session?.user.role !== "OWNER") {
    notFound();
  }

  if (template.variants.length === 0) {
    notFound();
  }

  const variants = template.variants.map((v) => ({
    id: v.id,
    label: v.label,
    dpi: v.dpi,
    canvasJson: v.canvasJson,
    fields: template.fields
      .filter((f) => f.variantId === v.id && f.isEditable)
      .map((f) => ({
        fieldKey: f.fieldKey,
        label: f.label,
        defaultValue: f.defaultValue ?? "",
        maxLength: f.maxLength,
      })),
  }));

  return (
    <FillEditor
      templateId={template.id}
      templateName={template.name}
      variants={variants}
    />
  );
}
