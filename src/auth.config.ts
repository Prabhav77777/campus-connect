import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role as string | undefined;
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isPublicRoute = ["/login", "/signup"].includes(nextUrl.pathname);

      if (isApiAuthRoute) return true;

      if (isPublicRoute) {
        if (isLoggedIn) {
          if (userRole === "ADMIN") {
            return Response.redirect(new URL("/admin", nextUrl));
          }
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) return false;

      if (nextUrl.pathname.startsWith("/admin") && userRole !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (nextUrl.pathname === "/" && userRole === "ADMIN") {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role || "STUDENT";
        token.hostel = (user as { hostel?: string }).hostel || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { hostel: string }).hostel = token.hostel as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
