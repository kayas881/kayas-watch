"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createUser } from "./actions";

export function CreateUserForm({ isSuperAdmin, onClose }: { isSuperAdmin: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      await createUser(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-lg mb-6 relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <h3 className="text-lg font-medium text-white mb-4">Add Team Member</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Jane Doe"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="jane@example.com"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Role</label>
            <select
              name="role"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="VIEWER">Viewer (Read-only)</option>
              {isSuperAdmin && <option value="ADMIN">Admin (Full Access)</option>}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create User
          </button>
        </div>
      </form>
    </div>
  );
}
