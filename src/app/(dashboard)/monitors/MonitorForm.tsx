"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Monitor, Website } from "@prisma/client";

interface MonitorFormProps {
  initialData?: Monitor;
  websites: Pick<Website, "id" | "name" | "url">[];
  action: (formData: FormData) => Promise<void>;
}

export function MonitorForm({ initialData, websites, action }: MonitorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Monitor Name *</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={initialData?.name}
            placeholder="e.g., Main API Health"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Target URL *</label>
          <input
            name="url"
            type="url"
            required
            placeholder="https://api.example.com/health"
            defaultValue={initialData?.url}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Associated Website *</label>
          <select
            name="websiteId"
            required
            defaultValue={initialData?.websiteId}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 appearance-none"
            disabled={loading}
          >
            <option value="" disabled>Select a website...</option>
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.name} ({website.url})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Monitor Type *</label>
          <select
            name="type"
            required
            defaultValue={initialData?.type || "HTTP"}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 appearance-none"
            disabled={loading}
          >
            <option value="HTTP">HTTP(s)</option>
            <option value="TCP">TCP Port</option>
            <option value="PING">Ping</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Check Interval (Seconds)</label>
          <input
            name="intervalSeconds"
            type="number"
            min="20"
            required
            defaultValue={initialData?.intervalSeconds || 60}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Retries Before Alert</label>
          <input
            name="retryPolicy"
            type="number"
            min="0"
            required
            defaultValue={initialData?.retryPolicy || 3}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>
        
        {initialData && (
          <div className="flex items-center gap-3 md:col-span-2 mt-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={initialData.isActive}
              className="w-4 h-4 rounded border-zinc-800 bg-zinc-900/50 text-violet-600 focus:ring-violet-500"
              disabled={loading}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-zinc-300">
              Active (Monitor is currently running)
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <Link
          href="/monitors"
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
          {initialData ? "Save Changes" : "Add Monitor"}
        </button>
      </div>
    </form>
  );
}
