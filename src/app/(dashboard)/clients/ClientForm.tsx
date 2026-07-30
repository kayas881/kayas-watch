"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Client } from "@prisma/client";

interface ClientFormProps {
  initialData?: Client;
  action: (formData: FormData) => Promise<void>;
}

export function ClientForm({ initialData, action }: ClientFormProps) {
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
          <label className="text-sm font-medium text-zinc-400">Company Name *</label>
          <input
            name="companyName"
            type="text"
            required
            defaultValue={initialData?.companyName}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Primary Domain</label>
          <input
            name="primaryDomain"
            type="text"
            placeholder="example.com"
            defaultValue={initialData?.primaryDomain || ""}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Contact Person</label>
          <input
            name="contactPerson"
            type="text"
            defaultValue={initialData?.contactPerson || ""}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Contact Email</label>
          <input
            name="contactEmail"
            type="email"
            defaultValue={initialData?.contactEmail || ""}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Support SLA</label>
          <input
            name="supportSla"
            type="text"
            placeholder="e.g., 24/7, 9-5 Mon-Fri"
            defaultValue={initialData?.supportSla || ""}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Maintenance Plan</label>
          <input
            name="maintenancePlan"
            type="text"
            placeholder="e.g., Premium, Basic"
            defaultValue={initialData?.maintenancePlan || ""}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <Link
          href="/clients"
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
          {initialData ? "Save Changes" : "Create Client"}
        </button>
      </div>
    </form>
  );
}
