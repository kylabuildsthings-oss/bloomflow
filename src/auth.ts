import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * NextAuth.js configuration with email/password (Credentials) provider.
 * Uses JWT for sessions - compatible with Credentials provider.
 *
 * Customize the authorize callback to validate against your database.
 * For production, use a database adapter with user storage.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (url && key) {
          const supabase = createClient(url, key);
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, password_hash")
            .eq("email", credentials.email)
            .single();

          if (
            profile?.password_hash &&
            (await bcrypt.compare(credentials.password, profile.password_hash))
          ) {
            return {
              id: profile.id,
              email: profile.email,
              name: profile.email?.split("@")[0],
            };
          }
        }

        // Demo fallback for development
        const demoEmail = process.env.DEMO_USER_EMAIL ?? "demo@bloomflow.com";
        const demoPasswordHash =
          process.env.DEMO_USER_PASSWORD_HASH?.trim() ||
          "$2b$10$qzG5FbCSulWWHsn4eZByHe5BjQRbr0CM5mJ5KP8VSj1c4dI0i9Njy"; // demo123

        if (
          credentials.email === demoEmail &&
          (await bcrypt.compare(credentials.password, demoPasswordHash))
        ) {
          return {
            id: "1",
            email: demoEmail,
            name: "Demo User",
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
