import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma, ensureDbInitialized } from "./db";
import { authConfig } from "../auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "rL9xP2wK7mQ4vN1zY8jF5tU3sA6eC0bX9dE8fG1hI2k=",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await ensureDbInitialized();

          const cleanEmail = (credentials.email as string).trim().toLowerCase();
          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!user) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hostel: user.hostel,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
});
