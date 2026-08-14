import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - api/webhooks (Webhook endpoints)
     * - api/cron (Cron job endpoints — authenticated via Bearer token)
     * - login (public login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|api/webhooks|api/cron|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
