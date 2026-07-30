import { MonitorForm } from "../MonitorForm";
import { updateMonitor, deleteMonitor } from "../actions";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function EditMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "VIEWER") return <div className="p-8 text-red-400">Unauthorized</div>;

  const { id } = await params;
  
  const monitor = await prisma.monitor.findUnique({
    where: { id },
  });

  if (!monitor) {
    notFound();
  }

  const websites = await prisma.website.findMany({
    select: { id: true, name: true, url: true },
    orderBy: { name: "asc" }
  });

  const updateAction = updateMonitor.bind(null, monitor.id);
  const deleteAction = deleteMonitor.bind(null, monitor.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/monitors"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Edit Monitor</h1>
            <p className="text-zinc-400 mt-1">Update details for {monitor.name}.</p>
          </div>
        </div>

        <DeleteButton 
          action={deleteAction} 
          itemType="Monitor" 
          warningText="This will permanently delete this monitor in both the dashboard and Uptime Kuma." 
        />
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 border border-zinc-800/50">
        <MonitorForm initialData={monitor} websites={websites} action={updateAction} />
      </div>
    </div>
  );
}
