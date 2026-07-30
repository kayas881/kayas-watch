"use client";

import { useState } from "react";
import { User, Shield, ShieldAlert, ShieldCheck, MoreVertical, Plus } from "lucide-react";
import { CreateUserForm } from "./CreateUserForm";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteUser, updateUserRole } from "./actions";

interface UserListProps {
  users: any[];
  currentUserRole: string;
  currentUserId: string;
}

export function UserList({ users, currentUserRole, currentUserId }: UserListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const isSuperAdmin = currentUserRole === "SUPERADMIN";

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case "ADMIN":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <User className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Super Admin</span>;
      case "ADMIN":
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Admin</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">Viewer</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Team Members</h2>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {showCreate && (
        <CreateUserForm 
          isSuperAdmin={isSuperAdmin} 
          onClose={() => setShowCreate(false)} 
        />
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const canDelete = !isSelf && (isSuperAdmin || user.role === "VIEWER");
                const deleteAction = deleteUser.bind(null, user.id);

                return (
                  <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            {user.name || "Unnamed"}
                            {isSelf && <span className="text-[10px] uppercase tracking-wider bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/20">You</span>}
                          </div>
                          <div className="text-sm text-zinc-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canDelete ? (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                          {/* Superadmins can promote/demote viewers and admins */}
                          {isSuperAdmin && user.role !== "SUPERADMIN" && (
                            <button
                              onClick={() => updateUserRole(user.id, user.role === "ADMIN" ? "VIEWER" : "ADMIN")}
                              className="text-xs font-medium text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                            >
                              Make {user.role === "ADMIN" ? "Viewer" : "Admin"}
                            </button>
                          )}
                          <DeleteButton action={deleteAction} itemType="User" warningText={`This will permanently remove ${user.email} from the system.`} />
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
