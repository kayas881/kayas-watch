import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Globe, ExternalLink, Building2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-utils";
import { ImportButton } from "./ImportButton";

export const dynamic = "force-dynamic";

export default async function WebsitesPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role !== "VIEWER";
  const websites = await prisma.website.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: { companyName: true }
      },
      _count: {
        select: { monitors: true }
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Websites</h1>
          <p className="text-zinc-400 mt-1">Manage and track all client websites.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <ImportButton />
            <Link
              href="/websites/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors glow-primary"
            >
              <Plus className="w-4 h-4" />
              Add Website
            </Link>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-zinc-800/50 overflow-hidden">
        {websites.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No websites found</h3>
            <p className="text-zinc-400 mb-6 max-w-sm">
              Add websites to clients so you can begin tracking their uptime and performance.
            </p>
            {isAdmin && (
              <Link
                href="/websites/new"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Website
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Monitors</th>
                  {isAdmin && <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {websites.map((website) => (
                  <tr key={website.id} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{website.name}</span>
                        <a 
                          href={website.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-zinc-500 flex items-center gap-1 mt-1 hover:text-zinc-300 transition-colors"
                        >
                          {website.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-500" />
                        {website.client.companyName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold border border-violet-500/20">
                        {website._count.monitors}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/websites/${website.id}`}
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
