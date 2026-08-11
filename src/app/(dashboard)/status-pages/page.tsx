import { Radio, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StatusPagesList() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Status Pages</h1>
          <p className="text-zinc-400 mt-1">Manage public-facing status pages (Under Construction)</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-violet-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Native Status Pages Coming Soon</h3>
          <p className="text-zinc-400 max-w-sm mb-6">
            We have completely removed the unstable Uptime Kuma dependency in favor of Vercel-native health checking.
            <br /><br />
            Public status pages will be re-introduced as a native feature in a future update, powered directly by this dashboard!
          </p>
        </div>
      </div>
    </div>
  );
}
