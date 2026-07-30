"use client";

import { useTransition } from "react";
import { updateIncidentStatus } from "../actions";
import { Loader2 } from "lucide-react";

interface Props {
  incidentId: string;
  currentStatus: string;
}

export function IncidentStatusSelect({ incidentId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      try {
        await updateIncidentStatus(incidentId, newStatus);
      } catch (error) {
        console.error("Failed to update status", error);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-zinc-400">Update Status:</label>
      <div className="relative">
        <select
          disabled={isPending}
          value={currentStatus}
          onChange={handleStatusChange}
          className="bg-zinc-900 border border-zinc-700 text-sm font-medium text-white rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-violet-500 appearance-none disabled:opacity-50"
        >
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        {isPending && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
