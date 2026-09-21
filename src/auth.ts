import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  type UserRole,
} from "@/db/schema";
import { isDevLoginEnabled, isGoogleAuthConfigured } from "@/lib/env";
import { sendMagicLink } from "@/lib/mail";

const db = await getDb();

const providers: NextAuthConfig["providers"] = [
  Resend({
    apiKey: process.env.RESEND_API_KEY ?? "re_dev_placeholder",
    from: process.env.EMAIL_FROM ?? "Fillslot <noreply@fillslot.local>",
    sendVerificationRequest: async ({ identifier, url }) => {
      await sendMagicLink(identifier, url);
    },
  }),
];

if (isGoogleAuthConfigured()) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (isDevLoginEnabled()) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "");
        if (!email) return null;
        const db = await getDb();
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "consumer";
      }
      if (!token.role && token.email) {
        const db = await getDb();
        const existing = await db.query.users.findFirst({
          where: eq(users.email, String(token.email)),
        });
        if (existing) {
          token.id = existing.id;
          token.role = existing.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = (token.role as UserRole) ?? "consumer";
      }
      return session;
    },
  },
});
