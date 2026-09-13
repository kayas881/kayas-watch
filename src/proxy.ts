import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // The cron route authenticates itself with CRON_SECRET. Keep this bypass
      // inside the auth callback as a defence against a matcher mismatch at
      // the deployment edge, where a redirect would prevent cron-job.org from
      // reaching the route handler.
      if (req.nextUrl.pathname.startsWith("/api/cron/")) {
        return true;
      }

      return !!token;
    },
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
