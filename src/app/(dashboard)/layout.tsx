"use client";

import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { LogOut, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <Activity className="w-8 h-8 text-violet-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 w-64">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center glow-primary">
              <Activity className="w-4 h-4 text-violet-500" />
            </div>
            <span className="font-semibold text-white tracking-tight">Kayas Watch</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-white leading-none">
                {session?.user?.name || "Admin"}
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                {session?.user?.email}
              </span>
            </div>
            
            <div className="w-px h-8 bg-white/10 hidden sm:block" />

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors",
                "px-3 py-1.5 rounded-lg hover:bg-white/5"
              )}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 w-full overflow-y-auto">
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
