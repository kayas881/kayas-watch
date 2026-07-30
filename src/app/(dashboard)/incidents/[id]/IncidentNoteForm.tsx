"use client";

import { useRef, useState } from "react";
import { addIncidentNote } from "../actions";
import { Send, Loader2 } from "lucide-react";

export function IncidentNoteForm({ incidentId }: { incidentId: string }) {
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await addIncidentNote(incidentId, formData);
      formRef.current?.reset();
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="relative">
      <textarea
        name="content"
        required
        placeholder="Add an internal note or update about this incident..."
        rows={3}
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 pr-14 resize-none"
        disabled={isPending}
      />
      <div className="absolute right-3 bottom-3 flex items-center">
        <button
          type="submit"
          disabled={isPending}
          className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5 mt-0.5" />}
        </button>
      </div>
    </form>
  );
}
