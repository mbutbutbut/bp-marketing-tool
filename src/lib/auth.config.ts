import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma adapter, no bcrypt, no Node.js APIs.
// Used by middleware; the full config (src/lib/auth.ts) extends this
// with the credentials provider and Prisma adapter for route handlers
// and server components.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "OWNER" | "EDITOR";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
