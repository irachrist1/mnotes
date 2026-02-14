"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Search, ChevronDown, ChevronUp, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

export function ResearchPanel({
  actionId,
  researchResults,
  actionTitle,
}: {
  actionId: Id<"actionableActions">;
  researchResults?: string | null;
  actionTitle: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [researching, setResearching] = useState(false);
  const triggerResearch = useAction(api.ai.research.triggerResearch);

  const handleResearch = async () => {
    setResearching(true);
    try {
      const result = await triggerResearch({ actionId });
      if (result.success) {
        toast.success("Research complete!");
        setExpanded(true);
      } else {
        toast.error(result.error ?? "Research failed");
      }
    } catch {
      toast.error("Failed to run research");
    } finally {
      setResearching(false);
    }
  };

  const handleDraftFromFindings = () => {
    window.dispatchEvent(
      new CustomEvent("mnotes:open-chat", {
        detail: {
          prompt: `Based on this research, help me draft "${actionTitle}":\n\n${researchResults?.slice(0, 1500) ?? ""}`,
        },
      })
    );
  };

  if (!researchResults) {
    return (
      <button
        onClick={() => void handleResearch()}
        disabled={researching}
        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors disabled:opacity-50"
      >
        {researching ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5" />
        )}
        {researching ? "Researching..." : "Research This"}
      </button>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
      >
        <Search className="w-3 h-3" />
        Research findings
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg bg-violet-50/50 dark:bg-violet-500/[0.04] border border-violet-200/50 dark:border-violet-800/30 p-3">
          <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {researchResults}
          </div>
          <button
            onClick={handleDraftFromFindings}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Draft from findings
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
