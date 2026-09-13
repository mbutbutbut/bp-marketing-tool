"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AppHeader({
  userName,
  role,
}: {
  userName: string;
  role: "OWNER" | "EDITOR";
}) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-zinc-900">
          Boulder Parc Template Studio
        </span>
        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          {role === "OWNER" && (
            <Link href="/app" className="hover:text-zinc-900">
              Templates
            </Link>
          )}
          <Link href="/fill" className="hover:text-zinc-900">
            Fill &amp; Export
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-600">
        <span>
          {userName} &middot; <span className="uppercase">{role}</span>
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
