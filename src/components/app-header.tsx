"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? "font-medium text-zinc-900"
          : "text-zinc-600 hover:text-zinc-900"
      }
    >
      {children}
    </Link>
  );
}

export default function AppHeader({
  userName,
  role,
}: {
  userName: string;
  role: "OWNER" | "EDITOR";
}) {
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
          <span className="truncate font-semibold text-zinc-900">
            Boulder Parc Template Studio
          </span>
          <nav className="flex items-center gap-4 text-sm">
            {role === "OWNER" && <NavLink href="/app">Templates</NavLink>}
            <NavLink href="/fill">Fill &amp; Export</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <span className="hidden sm:inline">
            {userName} &middot; <span className="uppercase">{role}</span>
          </span>
          <span className="text-xs font-medium uppercase sm:hidden">
            {role}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
