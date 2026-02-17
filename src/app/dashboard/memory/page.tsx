"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Brain,
  Search,
  Archive,
  Clock,
  Star,
  User,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Tier = "persistent" | "archival" | "session";

const TIER_META: Record<
  Tier,
  { label: string; description: string; icon: typeof Brain }
> = {
  persistent: {
    label: "Persistent",
    description: "Always loaded \u2014 key facts, preferences, corrections",
    icon: Star,
  },
  archival: {
    label: "Archival",
    description: "Heavy reference material loaded on demand",
    icon: Clock,
  },
  session: {
    label: "Session",
    description: "Ephemeral \u2014 cleared after each conversation",
    icon: Brain,
  },
};

export default function MemoryPage() {
  const [activeTier, setActiveTier] = useState<Tier>("persistent");
  const [searchQuery, setSearchQuery] = useState("");

  const memories = useQuery(api.memory.listByTier, {
    tier: activeTier,
    limit: 50,
  });
  const searchResults = useQuery(
    api.memory.search,
    searchQuery.length > 1 ? { query: searchQuery, limit: 20 } : "skip"
  );
  const archiveMemory = useMutation(api.memory.archive);

  const displayMemories = searchQuery.length > 1 ? searchResults : memories;

  return (
    <div className="h-full overflow-y-auto px-4 py-6 max-w-2xl mx-auto space-y-8">
      {/* ── Soul File Editor ─────────────────────────────── */}
      <SoulFileEditor />

      {/* ── Memory Browser ───────────────────────────────── */}
      <div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-stone-800 dark:text-stone-200">
              Memories
            </h2>
          </div>
          <p className="text-sm text-stone-500">
            Facts and preferences Jarvis has learned about you.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories\u2026"
            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl pl-9 pr-3 py-2 text-base sm:text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Tier tabs */}
        {!searchQuery && (
          <div className="flex gap-1 mb-4 bg-stone-100 dark:bg-stone-900 p-1 rounded-xl">
            {(["persistent", "archival", "session"] as Tier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTier === tier
                    ? "bg-white dark:bg-stone-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                }`}
              >
                {TIER_META[tier].label}
              </button>
            ))}
          </div>
        )}

        {/* Tier description */}
        {!searchQuery && (
          <p className="text-xs text-stone-400 dark:text-stone-600 mb-4">
            {TIER_META[activeTier].description}
          </p>
        )}

        {/* Memory list */}
        <div className="space-y-2">
          {displayMemories === undefined && (
            <div className="text-sm text-stone-500 text-center py-8">
              Loading\u2026
            </div>
          )}
          {displayMemories !== undefined && displayMemories.length === 0 && (
            <div className="text-sm text-stone-500 text-center py-8">
              {searchQuery
                ? "No memories matching that search."
                : `No ${activeTier} memories yet.`}
            </div>
          )}
          {displayMemories?.map((memory) => (
            <div
              key={memory._id}
              className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 group hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                      {memory.title}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-600 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-md flex-shrink-0">
                      {memory.category}
                    </span>
                    {searchQuery && (
                      <span className="text-xs text-blue-500 dark:text-blue-400/70 flex-shrink-0">
                        {memory.tier}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    {memory.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            i < memory.importance
                              ? "bg-blue-600"
                              : "bg-stone-200 dark:bg-stone-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400 dark:text-stone-600">
                      importance {memory.importance}/10
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-600">
                      \u00b7
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-600">
                      {memory.source}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    void archiveMemory({
                      memoryId: memory._id as Id<"memoryEntries">,
                    })
                  }
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                  title="Archive memory"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Soul File Editor ──────────────────────────────────────────────────────

function SoulFileEditor() {
  const soulFile = useQuery(api.memory.getSoulFile);
  const upsertSoulFile = useMutation(api.memory.upsertSoulFile);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  // Sync from server once on load
  useEffect(() => {
    if (soulFile !== undefined && !initialized.current) {
      setContent(soulFile?.content ?? "");
      initialized.current = true;
    }
  }, [soulFile]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      setDirty(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await upsertSoulFile({ content });
      setDirty(false);
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [content, dirty, upsertSoulFile]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-base font-semibold text-stone-800 dark:text-stone-200">
          Your Profile
        </h2>
      </div>
      <p className="text-sm text-stone-500 mb-3">
        Tell Jarvis about yourself. This is loaded at the start of every
        conversation.
      </p>
      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onBlur={() => void handleSave()}
          placeholder="I'm a software engineer working on... I prefer concise answers. My current projects include..."
          rows={6}
          className="w-full bg-transparent px-4 py-3 text-base sm:text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 outline-none resize-y min-h-[120px] leading-relaxed"
        />
        <div className="flex items-center justify-between px-4 py-2 border-t border-stone-200/60 dark:border-stone-700/40 bg-stone-100/50 dark:bg-stone-800/30">
          <span className="text-xs text-stone-400 dark:text-stone-600">
            {soulFile
              ? `v${soulFile.version} \u00b7 last saved ${new Date(soulFile.updatedAt).toLocaleDateString()}`
              : "Not created yet"}
          </span>
          <button
            onClick={() => void handleSave()}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-stone-200 dark:disabled:bg-stone-700 disabled:text-stone-400 dark:disabled:text-stone-500 text-white font-medium transition-colors"
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            {saving ? "Saving\u2026" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
