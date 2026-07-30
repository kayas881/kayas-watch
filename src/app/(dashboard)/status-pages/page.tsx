import { getStatusPagesFromKuma } from "@/lib/kuma";
import { Plus, Radio, ExternalLink } from "lucide-react";
import Link from "next/link";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteStatusPage } from "./actions";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function StatusPagesList() {
  const user = await getCurrentUser();
  const isAdmin = user?.role !== "VIEWER";
  let statusPages: any[] = [];
  let fetchError = null;

  try {
    const rawPages = await getStatusPagesFromKuma();
    // Kuma API returns an object where keys are IDs and values are objects
    if (rawPages && typeof rawPages === "object") {
      statusPages = Object.values(rawPages);
    }
  } catch (err: any) {
    console.error("Failed to fetch status pages from Kuma:", err);
    fetchError = err.message || "Could not reach Uptime Kuma.";
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Status Pages</h1>
          <p className="text-zinc-400 mt-1">Manage public-facing status pages directly in Uptime Kuma.</p>
        </div>
        {isAdmin && (
          <Link
            href="/status-pages/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors glow-primary"
          >
            <Plus className="w-4 h-4" />
            Add Status Page
          </Link>
        )}
      </div>

      {fetchError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          <strong>Error:</strong> {fetchError}
          <div className="mt-1 text-red-500/80">Ensure your Uptime Kuma instance is running and accessible.</div>
        </div>
      )}

      <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden">
        {statusPages.length === 0 && (!fetchError) ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No Status Pages</h3>
            <p className="text-zinc-400 max-w-sm mb-6">
              Create a public status page to transparently communicate uptime with your clients.
            </p>
            {isAdmin && (
              <Link
                href="/status-pages/new"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Status Page
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
            {statusPages.map((page: any) => {
              const deleteAction = deleteStatusPage.bind(null, page.slug);
              return (
                <div key={page.slug} className="group flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
                      <Radio className="w-5 h-5" />
                    </div>
                    {isAdmin && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DeleteButton action={deleteAction} itemType="Status Page" warningText={`This will permanently delete the status page '${page.title}' from Uptime Kuma.`} />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{page.title}</h3>
                  <div className="text-sm font-mono text-zinc-500 mb-6 bg-zinc-950 px-2 py-1 rounded inline-block self-start">
                    /{page.slug}
                  </div>
                  <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <a 
                      href={`http://localhost:3001/status/${page.slug}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors"
                    >
                      View Live Page
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
