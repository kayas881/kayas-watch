import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IncidentStatusSelect } from "./IncidentStatusSelect";
import { IncidentNoteForm } from "./IncidentNoteForm";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const isAdmin = user?.role !== "VIEWER";
  
  const { id } = await params;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      monitor: {
        include: {
          website: {
            include: {
              client: true
            }
          }
        }
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });

  if (!incident) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/incidents"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Incident Details</h1>
            <p className="text-zinc-400 mt-1">Manage incident status and communication.</p>
          </div>
        </div>

        {isAdmin && <IncidentStatusSelect incidentId={incident.id} currentStatus={incident.status} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Incident Overview Card */}
          <div className="glass rounded-2xl p-6 md:p-8 border border-zinc-800/50">
            <h2 className="text-lg font-medium text-white mb-6">Overview</h2>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <div className="text-sm text-zinc-500 mb-1">Status</div>
                <div className="flex items-center">
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
                </div>
              </div>
              
              <div>
                <div className="text-sm text-zinc-500 mb-1">Severity</div>
                <div className="text-sm font-medium text-zinc-200">{incident.severity}</div>
              </div>

              <div>
                <div className="text-sm text-zinc-500 mb-1">Opened At</div>
                <div className="text-sm font-medium text-zinc-200">
                  {format(incident.openedAt, "MMM d, yyyy h:mm a")}
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-500 mb-1">Resolved At</div>
                <div className="text-sm font-medium text-zinc-200">
                  {incident.resolvedAt ? format(incident.resolvedAt, "MMM d, yyyy h:mm a") : "-"}
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="text-sm text-zinc-500 mb-1">Summary</div>
                <div className="text-sm text-zinc-300 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  {incident.summary || "No summary provided by the automated monitor alert."}
                </div>
              </div>
            </div>
          </div>

          {/* Activity/Notes Timeline */}
          <div className="glass rounded-2xl p-6 md:p-8 border border-zinc-800/50">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-400" />
              Activity & Notes
            </h2>

            {isAdmin && (
              <div className="mb-8">
                <IncidentNoteForm incidentId={incident.id} />
              </div>
            )}

            <div className="space-y-6">
              {incident.notes.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-zinc-800 rounded-lg text-sm text-zinc-500">
                  No notes or activity yet.
                </div>
              ) : (
                <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                  {incident.notes.map((note) => (
                    <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 shadow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-zinc-200">
                            {note.user.name || note.user.email}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {format(note.createdAt, "h:mm a")}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-400">{note.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Affected Resources Sidebar */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-zinc-800/50">
            <h2 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Affected Monitor</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Monitor Name</div>
                <div className="text-sm font-medium text-white">{incident.monitor.name}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">URL</div>
                <a href={incident.monitor.url} target="_blank" rel="noreferrer" className="text-sm text-violet-400 hover:text-violet-300 break-all">
                  {incident.monitor.url}
                </a>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Type</div>
                <div className="text-xs font-medium text-zinc-300 bg-zinc-800 inline-block px-2 py-0.5 rounded uppercase">
                  {incident.monitor.type}
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-zinc-800/50">
            <h2 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Impacted Client</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Client</div>
                <div className="text-sm font-medium text-white">{incident.monitor.website.client.companyName}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Website</div>
                <div className="text-sm font-medium text-zinc-300">{incident.monitor.website.name}</div>
              </div>
              {incident.monitor.website.client.contactEmail && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Primary Contact</div>
                  <div className="text-sm text-zinc-300">{incident.monitor.website.client.contactEmail}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
