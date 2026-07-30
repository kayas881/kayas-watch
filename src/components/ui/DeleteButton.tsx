"use client";

import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useTransition, useState } from "react";

interface DeleteButtonProps {
  action: () => Promise<void>;
  itemType: string;
  warningText?: string;
}

export function DeleteButton({ action, itemType, warningText }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await action();
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setShowConfirm(true)}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        {isPending ? "Deleting..." : `Delete ${itemType}`}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Delete {itemType}?</h3>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6 pl-14">
              Are you absolutely sure you want to delete this {itemType.toLowerCase()}? {warningText || "This action cannot be undone."}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
