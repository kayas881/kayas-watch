import type { Metadata } from "next";
import "./globals.css";
import AuthWrapper from "@/components/ui/AuthWrapper";

export const metadata: Metadata = {
  title: "Saral Watch | Saral Infosoft Web Monitor",
  description: "Real-time client website and service monitoring platform by Saral Infosoft.",
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
