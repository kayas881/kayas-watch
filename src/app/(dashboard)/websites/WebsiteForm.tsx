"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Website, Client } from "@prisma/client";

interface WebsiteFormProps {
  initialData?: Website;
  clients: Pick<Client, "id" | "companyName">[];
  action: (formData: FormData) => Promise<void>;
}

export function WebsiteForm({ initialData, clients, action }: WebsiteFormProps) {
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
          <label className="text-sm font-medium text-zinc-400">Website Name *</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={initialData?.name}
            placeholder="e.g., Acme Production"
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">URL *</label>
          <input
            name="url"
            type="url"
            required
            placeholder="https://example.com"
            defaultValue={initialData?.url}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-zinc-400">Associated Client *</label>
          <select
            name="clientId"
            required
            defaultValue={initialData?.clientId}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 appearance-none"
            disabled={loading}
          >
            <option value="" disabled>Select a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-zinc-400">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Optional description of this website..."
            defaultValue={initialData?.description || ""}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <Link
          href="/websites"
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
          {initialData ? "Save Changes" : "Add Website"}
        </button>
      </div>
    </form>
  );
}
