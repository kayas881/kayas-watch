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
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-purple-950/50 glow-primary disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
      {loading ? "Checking Statuses..." : "Refresh Live Statuses"}
    </button>
  );
}
