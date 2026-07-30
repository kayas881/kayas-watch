import { WebsiteForm } from "../WebsiteForm";
import { updateWebsite, deleteWebsite } from "../actions";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function EditWebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "VIEWER") return <div className="p-8 text-red-400">Unauthorized</div>;

  const { id } = await params;
  
  const website = await prisma.website.findUnique({
    where: { id },
  });

  if (!website) {
    notFound();
  }

  const clients = await prisma.client.findMany({
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" }
  });

  const updateAction = updateWebsite.bind(null, website.id);
  const deleteAction = deleteWebsite.bind(null, website.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/websites"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Edit Website</h1>
            <p className="text-zinc-400 mt-1">Update details for {website.name}.</p>
          </div>
        </div>

        <DeleteButton 
          action={deleteAction} 
          itemType="Website" 
          warningText="This will also delete any monitors associated with this website." 
        />
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 border border-zinc-800/50">
        <WebsiteForm initialData={website} clients={clients} action={updateAction} />
      </div>
    </div>
  );
}
