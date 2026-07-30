import type { Metadata } from "next";
import "./globals.css";
import AuthWrapper from "@/components/ui/AuthWrapper";

export const metadata: Metadata = {
  title: "Kayas Watch",
  description: "Uptime Kuma dashboard for Kayas Infosoft",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
