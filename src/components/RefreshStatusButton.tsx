"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { refreshAllMonitorsHealth } from "@/app/(dashboard)/monitors/actions";

export function RefreshStatusButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshAllMonitorsHealth();
      router.refresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      title="Perform a live health check across all 63 monitors and update active incidents"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-600/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
      {loading ? "Checking Statuses..." : "Refresh Live Statuses"}
    </button>
  );
}
