import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Activity, ExternalLink, Globe, Pause, Play, CheckCircle2, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function MonitorsPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role !== "VIEWER";
  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      website: {
        select: { name: true, url: true }
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Monitors</h1>
          <p className="text-zinc-400 mt-1">Manage and view the status of all your active monitors.</p>
        </div>
        {isAdmin && (
          <Link
            href="/monitors/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors glow-primary"
          >
            <Plus className="w-4 h-4" />
            Add Monitor
          </Link>
        )}
      </div>

      <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden">
        {monitors.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No monitors found</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">
              Create a monitor to start tracking the uptime of a website. Make sure you have at least one website configured.
            </p>
            {isAdmin && (
              <Link
                href="/monitors/new"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Monitor
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Type / Interval</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Related Website</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {monitors.map((monitor) => (
                  <tr key={monitor.id} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!monitor.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-500/10 text-zinc-400">
                          <Pause className="w-3.5 h-3.5 fill-current" /> Paused
                        </span>
                      ) : monitor.status === "UP" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Up
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Down
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-white flex items-center gap-2">
                          {monitor.name}
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {monitor.type}
                          </span>
                        </span>
                        <a 
                          href={monitor.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-zinc-500 flex items-center gap-1 mt-1 hover:text-zinc-300 transition-colors"
                        >
                          {monitor.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-300 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-500" />
                        {monitor.website.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      Every {monitor.intervalSeconds}s
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/monitors/${monitor.id}`}
                          className="text-sm font-medium text-violet-400 hover:text-violet-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
