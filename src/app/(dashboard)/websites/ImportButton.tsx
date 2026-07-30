"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { ExcelImportModal } from "./ExcelImportModal";
import { useRouter } from "next/navigation";

export function ImportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
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
    </>
  );
}
