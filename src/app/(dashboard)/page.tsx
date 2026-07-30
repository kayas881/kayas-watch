import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/ui/MetricCard";
import { Users, Activity, CheckCircle2, XCircle, AlertOctagon, History } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

import { RefreshStatusButton } from "@/components/RefreshStatusButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch real data simultaneously for performance
  const [
    totalClients,
    totalMonitors,
    sitesUp,
    sitesDown,
    activeIncidents,
    recentIncidents,
    latestActivity
  ] = await Promise.all([
    prisma.client.count(),
    prisma.monitor.count(),
    prisma.monitor.count({ where: { status: "UP" } }),
    prisma.monitor.count({ where: { status: "DOWN" } }),
    prisma.incident.count({ where: { status: "OPEN" } }),
    prisma.incident.findMany({
      orderBy: { openedAt: "desc" },
      take: 5,
      include: { monitor: { include: { website: true } } }
    }),
    prisma.monitor.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { website: true }
    })
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-zinc-400 mt-1">Real-time status of all client monitors and active incidents.</p>
        </div>
        <RefreshStatusButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <MetricCard
          title="Total Clients"
          value={totalClients}
          icon={Users}
          color="default"
        />
        <MetricCard
          title="Total Monitors"
          value={totalMonitors}
          icon={Activity}
          color="violet"
        />
        <MetricCard
          title="Sites Up"
          value={sitesUp}
          icon={CheckCircle2}
          color="green"
        />
        <MetricCard
          title="Sites Down"
          value={sitesDown}
          icon={XCircle}
          color={sitesDown > 0 ? "red" : "default"}
        />
        <MetricCard
          title="Active Incidents"
          value={activeIncidents}
          icon={AlertOctagon}
          color={activeIncidents > 0 ? "red" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-red-500" />
              Recent Incidents
            </h3>
            <Link href="/incidents" className="text-sm text-violet-400 hover:text-violet-300 font-medium">
              View all
            </Link>
          </div>
          <div className="flex-1 p-6">
            {recentIncidents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mb-3" />
                <p>No recent incidents recorded.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-start justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="text-lg font-semibold text-white">{incident.monitor.name}</p>
                      <p className="text-base text-zinc-400 mt-1">
                        {incident.status === "RESOLVED" ? "Resolved" : "Ongoing issue"} • {formatDistanceToNow(incident.openedAt)} ago
                      </p>
                    </div>
                    <span className={cn(
                      "px-3 py-1.5 text-sm font-semibold rounded-full",
                      incident.status === "OPEN" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                      incident.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}>
                      {incident.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latest Activity */}
        <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-violet-500" />
              Latest Monitor Activity
            </h3>
            <Link href="/monitors" className="text-sm text-violet-400 hover:text-violet-300 font-medium">
              View all
            </Link>
          </div>
          <div className="flex-1 p-6">
            {latestActivity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-8">
                <Activity className="w-8 h-8 mb-3 opacity-20" />
                <p>No monitor activity yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {latestActivity.map((monitor) => (
                  <div key={monitor.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shadow-lg",
                        monitor.status === "UP" ? "bg-emerald-500 shadow-emerald-500/50" :
                        monitor.status === "DOWN" ? "bg-red-500 shadow-red-500/50" : "bg-amber-500 shadow-amber-500/50"
                      )} />
                      <div>
                        <p className="text-lg font-semibold text-white">{monitor.name}</p>
                        <p className="text-sm font-medium text-zinc-400 mt-1">{monitor.website.name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-400">
                      {formatDistanceToNow(monitor.updatedAt)} ago
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
