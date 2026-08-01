import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Users,
  Activity,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  AlertTriangle,
  Shield,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";
import { RefreshStatusButton } from "@/components/RefreshStatusButton";

export const dynamic = "force-dynamic";

function formatDowntime(openedAt: Date) {
  const mins = differenceInMinutes(new Date(), openedAt);
  if (mins < 60) return `${mins}m`;
  const hrs = differenceInHours(new Date(), openedAt);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

function HttpStatusBadge({ code }: { code: number | null }) {
  if (code === null || code === undefined) return null;
  const isTimeout = code === 0;
  const is5xx = code >= 500;
  const is4xx = code >= 400 && code < 500;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold tracking-wider font-mono",
      isTimeout ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
      is5xx     ? "bg-rose-500/15 text-rose-300 border border-rose-500/30" :
      is4xx     ? "bg-orange-500/15 text-orange-300 border border-orange-500/30" :
                  "bg-zinc-500/15 text-zinc-300 border border-zinc-500/30"
    )}>
      {isTimeout ? "TIMEOUT" : `HTTP ${code}`}
    </span>
  );
}

export default async function DashboardPage() {
  const [
    totalClients,
    totalMonitors,
    sitesUp,
    sitesDown,
    activeIncidents,
    openIncidents,
    recentResolved,
    allClientsWithHealth,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.monitor.count(),
    prisma.monitor.count({ where: { status: "UP" } }),
    prisma.monitor.count({ where: { status: "DOWN" } }),
    prisma.incident.count({ where: { status: "OPEN" } }),

    // Full open incidents with error detail — the main outage panel
    prisma.incident.findMany({
      where: { status: "OPEN" },
      orderBy: { openedAt: "asc" },
      include: {
        monitor: {
          include: {
            website: { include: { client: { select: { companyName: true } } } }
          }
        }
      }
    }),

    // Recently resolved (last 24h)
    prisma.incident.findMany({
      where: {
        status: "RESOLVED",
        resolvedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { resolvedAt: "desc" },
      take: 5,
      include: {
        monitor: { select: { name: true, url: true } }
      }
    }),

    // Client health overview
    prisma.client.findMany({
      include: {
        websites: {
          include: {
            monitors: { select: { status: true } }
          }
        }
      },
      orderBy: { companyName: "asc" }
    }),
  ]);

  const uptimePct = totalMonitors > 0
    ? Math.round((sitesUp / totalMonitors) * 100)
    : 100;

  // Build per-client health summary
  const clientHealth = allClientsWithHealth.map((client) => {
    const allMonitors = client.websites.flatMap((w) => w.monitors);
    const down = allMonitors.filter((m) => m.status === "DOWN").length;
    const total = allMonitors.length;
    return { id: client.id, name: client.companyName, total, down, up: total - down };
  }).sort((a, b) => b.down - a.down); // Most affected first

  const criticalClients = clientHealth.filter((c) => c.down > 0);
  const healthyClients  = clientHealth.filter((c) => c.down === 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">
              Saral Infosoft Core
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
              sitesDown === 0
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            )}>
              {sitesDown === 0 ? "● All Systems Operational" : `● ${sitesDown} Sites Down`}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Real-time uptime monitoring for {totalClients} clients · {totalMonitors} active monitors
          </p>
        </div>
        <RefreshStatusButton />
      </div>

      {/* Metric Cards — 4 cards (Sites Down merged into Sites Up) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Clients"
          value={totalClients}
          icon={Users}
          color="violet"
          href="/clients"
          subStat={{ value: `${clientHealth.filter(c => c.down > 0).length} affected`, label: "clients with outages", color: clientHealth.filter(c => c.down > 0).length > 0 ? "red" : "green" }}
        />
        <MetricCard
          title="Monitors"
          value={totalMonitors}
          icon={Activity}
          color="default"
          href="/monitors"
          subStat={{ value: `${uptimePct}%`, label: "overall uptime", color: uptimePct >= 90 ? "green" : uptimePct >= 70 ? "amber" : "red" }}
        />
        <MetricCard
          title="Sites Up"
          value={sitesUp}
          icon={Wifi}
          color="green"
          href="/monitors"
          subStat={sitesDown > 0
            ? { value: `${sitesDown} DOWN`, label: "need attention", color: "red" }
            : { value: "All clear", label: "no issues", color: "green" }
          }
        />
        <MetricCard
          title="Open Incidents"
          value={activeIncidents}
          icon={AlertOctagon}
          color={activeIncidents > 0 ? "red" : "green"}
          href="/incidents"
          subStat={recentResolved.length > 0
            ? { value: `${recentResolved.length}`, label: "resolved in last 24h", color: "green" }
            : { value: "None", label: "resolved today", color: "zinc" }
          }
        />
      </div>

      {/* === LIVE OUTAGE PANEL === */}
      {openIncidents.length > 0 ? (
        <div className="rounded-2xl border border-rose-500/30 overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.07), rgba(17,20,32,0.95))" }}>
          <div className="px-6 py-4 border-b border-rose-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-lg shadow-rose-500/50" />
              <h2 className="text-lg font-bold text-white">
                Live Outages
                <span className="ml-2 text-sm font-semibold text-rose-400">({openIncidents.length} active)</span>
              </h2>
            </div>
            <Link href="/incidents" className="text-sm text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1">
              Manage all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-rose-500/10">
            {openIncidents.map((incident) => {
              const monitor = incident.monitor;
              const website = monitor.website;
              const client  = website.client;
              return (
                <div key={incident.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-rose-500/5 transition-colors">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Status dot + pulse */}
                    <div className="flex-shrink-0 mt-1">
                      <WifiOff className="w-5 h-5 text-rose-400" />
                    </div>

                    <div className="min-w-0">
                      {/* Site name + client */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-white text-base">{monitor.name}</span>
                        <span className="text-xs text-zinc-500">·</span>
                        <span className="text-xs text-zinc-400 font-medium">{client.companyName}</span>
                        {incident.httpStatusCode !== null && (
                          <HttpStatusBadge code={incident.httpStatusCode} />
                        )}
                      </div>

                      {/* URL */}
                      <a
                        href={monitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-purple-300 transition-colors font-mono truncate max-w-xs"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {monitor.url}
                      </a>

                      {/* Error detail */}
                      {incident.errorDetail && (
                        <p className="mt-1 text-sm text-rose-300/80 font-medium">
                          ⚠ {incident.errorDetail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 sm:flex-col sm:items-end">
                    {/* Down duration */}
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-bold">Down {formatDowntime(incident.openedAt)}</span>
                    </div>

                    {/* View incident link */}
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 font-semibold transition-colors"
                    >
                      View Incident →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* All Systems Green Banner */
        <div className="rounded-2xl border border-emerald-500/20 px-6 py-5 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.07), rgba(17,20,32,0.95))" }}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-emerald-400 text-base">All Systems Operational</p>
            <p className="text-zinc-400 text-sm">All {totalMonitors} monitors are responding normally. No active incidents.</p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <span className="text-2xl font-extrabold text-emerald-400">{uptimePct}%</span>
            <p className="text-xs text-zinc-500 text-right">uptime</p>
          </div>
        </div>
      )}

      {/* Bottom panels: Recent Resolution */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Recently Resolved
              <span className="text-xs text-zinc-500 font-normal">— last 24h</span>
            </h3>
            <Link href="/incidents" className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
              All incidents →
            </Link>
          </div>
          <div className="flex-1 p-5">
            {recentResolved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-zinc-500 text-sm">No incidents resolved in the last 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentResolved.map((incident) => (
                  <Link
                    key={incident.id}
                    href={`/incidents/${incident.id}`}
                    className="flex items-start justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="font-semibold text-white text-sm truncate">{incident.monitor.name}</span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono truncate ml-5">{incident.monitor.url}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4 text-right">
                      <span className="text-xs text-emerald-400 font-bold">Resolved</span>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {incident.resolvedAt ? formatDistanceToNow(incident.resolvedAt, { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
