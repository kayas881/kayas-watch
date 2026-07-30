import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const incidents = await prisma.incident.findMany({
    orderBy: { openedAt: "desc" },
    include: {
      monitor: {
        select: { name: true, url: true, type: true }
      },
      _count: {
        select: { notes: true }
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Incidents</h1>
          <p className="text-zinc-400 mt-1">Track and manage monitor outages and degraded performance.</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden">
        {incidents.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No Incidents</h3>
            <p className="text-zinc-400 max-w-sm">
              All systems are fully operational. No incidents have been reported yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Monitor</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Opened</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {incident.status === "OPEN" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> Open
                        </span>
                      ) : incident.status === "ACKNOWLEDGED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> Acknowledged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{incident.monitor.name}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{incident.monitor.url}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-zinc-300">
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {formatDistanceToNow(incident.openedAt, { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
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
