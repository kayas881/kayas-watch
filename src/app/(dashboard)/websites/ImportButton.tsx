"use client";

import { useState } from "react";
import { FileUp, RefreshCw, Loader2 } from "lucide-react";
import { ExcelImportModal } from "./ExcelImportModal";
import { useRouter } from "next/navigation";
import { syncWebsitesToMonitors } from "./actions";

export function ImportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const count = await syncWebsitesToMonitors();
      alert(`Successfully created ${count} active monitors for your websites!`);
      router.refresh();
    } catch (err: any) {
      alert("Sync error: " + (err.message || "Failed to sync monitors"));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        title="Automatically create Uptime Monitors for all websites currently missing a monitor"
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-600/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {syncing ? "Creating Monitors..." : "Create All Monitors"}
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-600/20 rounded-lg text-sm font-medium transition-colors"
      >
        <FileUp className="w-4 h-4" />
        Import via Excel
      </button>

      {isOpen && (
        <ExcelImportModal 
          onClose={() => setIsOpen(false)} 
          onSuccess={(count) => {
            setIsOpen(false);
            alert(`Successfully imported ${count} websites!`);
            router.refresh();
          }} 
        />
      )}
    </div>
  );
}
