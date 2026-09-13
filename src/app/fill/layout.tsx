import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppHeader from "@/components/app-header";

export default async function FillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppHeader userName={session.user.name ?? session.user.email ?? ""} role={session.user.role} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
