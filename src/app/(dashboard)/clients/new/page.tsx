import { ClientForm } from "../ClientForm";
import { createClient } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  const user = await getCurrentUser();
  if (user?.role === "VIEWER") return <div className="p-8 text-red-400">Unauthorized</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/clients"
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Add New Client</h1>
          <p className="text-zinc-400 mt-1">Register a new client to start tracking their websites.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 border border-zinc-800/50">
        <ClientForm action={createClient} />
      </div>
    </div>
  );
}
