"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StatusPageFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function StatusPageForm({ action }: StatusPageFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
      router.push("/status-pages");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Title *</label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g., Acme Corp System Status"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Slug *</label>
          <div className="flex items-center">
            <span className="bg-zinc-900 border border-r-0 border-zinc-800 rounded-l-lg px-3 py-2.5 text-sm text-zinc-500">
              /status/
            </span>
            <input
              name="slug"
              type="text"
              required
              placeholder="acme-status"
              pattern="^[a-z0-9-]+$"
              title="Only lowercase letters, numbers, and hyphens are allowed."
              className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-r-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-zinc-500">This will be the URL path for your status page (e.g. status.yourdomain.com/status/acme-status)</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Description (Optional)</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Welcome to our public status page..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <Link
          href="/status-pages"
          className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Status Page
        </button>
      </div>
    </form>
  );
}
