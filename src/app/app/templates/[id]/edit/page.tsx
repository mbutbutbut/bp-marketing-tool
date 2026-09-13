import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TemplateEditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const variant = await prisma.templateVariant.findFirst({
    where: { templateId: id },
    orderBy: { createdAt: "asc" },
  });

  if (!variant) {
    notFound();
  }

  redirect(`/app/templates/${id}/edit/${variant.id}`);
}
