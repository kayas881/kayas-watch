import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserList } from "./UserList";
import { Settings, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return null;
  }

  // Only Admins and Superadmins can view the settings page
  if (currentUser.role === "VIEWER") {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Access Denied</h3>
        <p className="text-zinc-400 max-w-md">
          You do not have permission to view this page. Settings and team management are restricted to administrators.
        </p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-zinc-400" />
          Workspace Settings
        </h1>
        <p className="text-zinc-400 mt-1">Manage your team members and workspace preferences.</p>
      </div>

      <div className="space-y-12">
        <section>
          <UserList 
            users={users} 
            currentUserRole={currentUser.role} 
            currentUserId={currentUser.id} 
          />
        </section>

        <section>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-2">Workspace Preferences</h2>
            <p className="text-sm text-zinc-400 mb-4">
              More settings regarding workspace notifications and billing will be available in the future.
            </p>
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 text-sm text-zinc-500 text-center">
              Coming soon
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
