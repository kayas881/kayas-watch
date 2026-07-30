"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {error && (
        <div className="p-3 text-sm font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            name="email"
            type="email"
            required
            placeholder="admin@kayasadmin.com"
            className={cn(
              "w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5",
              "text-sm text-zinc-200 placeholder:text-zinc-600",
              "focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className={cn(
              "w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5",
              "text-sm text-zinc-200 placeholder:text-zinc-600",
              "focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full mt-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all glow-primary",
          "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-violet-600 flex items-center justify-center gap-2"
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
      </button>
    </form>
  );
}
