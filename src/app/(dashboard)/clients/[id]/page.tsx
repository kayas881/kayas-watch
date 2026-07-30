import { ClientForm } from "../ClientForm";
import { updateClient, deleteClient } from "../actions";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "VIEWER") return <div className="p-8 text-red-400">Unauthorized</div>;

  const { id } = await params;
  
  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    notFound();
  }

  const updateAction = updateClient.bind(null, client.id);
  const deleteAction = deleteClient.bind(null, client.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/clients"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Edit Client</h1>
            <p className="text-zinc-400 mt-1">Update details for {client.companyName}.</p>
          </div>
        </div>

        <DeleteButton 
          action={deleteAction} 
          itemType="Client" 
          warningText="This will delete all associated websites and monitors." 
        />
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 border border-zinc-800/50">
        <ClientForm initialData={client} action={updateAction} />
      </div>
    </div>
  );
}
