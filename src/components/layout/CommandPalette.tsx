"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Command } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

type PaletteItem = {
  key: string;
  title: string;
  subtitle: string;
  route: string;
  kind: "savedInsight" | "idea" | "mentorship" | "income" | "navigation";
  id?: string;
  priority: "low" | "medium" | "high" | null;
};

const NAV_ITEMS: PaletteItem[] = [
  {
    key: "nav-home",
    title: "Home",
    subtitle: "Dashboard overview",
    route: "/dashboard",
    kind: "navigation",
    priority: null,
  },
  {
    key: "nav-data-income",
    title: "Income Streams",
    subtitle: "Your Data → Income tab",
    route: "/dashboard/data?tab=income",
    kind: "navigation",
    priority: null,
  },
  {
    key: "nav-data-ideas",
    title: "Ideas Pipeline",
    subtitle: "Your Data → Ideas tab",
    route: "/dashboard/data?tab=ideas",
    kind: "navigation",
    priority: null,
  },
  {
    key: "nav-data-mentorship",
    title: "Mentorship",
    subtitle: "Your Data → Mentorship tab",
    route: "/dashboard/data?tab=mentorship",
    kind: "navigation",
    priority: null,
  },
  {
    key: "nav-data-tasks",
    title: "Tasks",
    subtitle: "Your Data → Tasks tab",
    route: "/dashboard/data?tab=tasks",
    kind: "navigation",
    priority: null,
  },
  {
    key: "nav-intelligence",
    title: "Intelligence",
    subtitle: "AI Insights & Analytics",
    route: "/dashboard/intelligence",
    kind: "navigation",
    priority: null,
  },
  {
    key: "nav-settings",
    title: "Settings",
    subtitle: "AI provider and account settings",
    route: "/dashboard/settings",
    kind: "navigation",
    priority: null,
  },
];

export function CommandPalette() {
  const router = useRouter();
  const touchSavedUsage = useMutation(api.savedInsights.touchUsage);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const backendResults = useQuery(
    api.commandPalette.search,
    open
      ? {
        q: query,
        limit: 12,
      }
      : "skip"
  );

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const navMatches = NAV_ITEMS.filter((item) => {
      if (!q) return true;
      return `${item.title} ${item.subtitle}`.toLowerCase().includes(q);
    });

    const crossEntity = (backendResults ?? []).map((result) => ({
      key: `${result.kind}-${result.id}`,
      title: result.title,
      subtitle: result.subtitle,
      route: result.route,
      kind: result.kind,
      id: result.id,
      priority: result.priority,
    }));

    return [...crossEntity, ...navMatches];
  }, [backendResults, query]);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, query]);

  useEffect(() => {
    if (selectedIndex <= items.length - 1) return;
    setSelectedIndex(Math.max(0, items.length - 1));
  }, [items.length, selectedIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isModK) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const runItem = async (item: PaletteItem) => {
    if (item.kind === "savedInsight" && item.id) {
      void touchSavedUsage({ id: item.id as Id<"savedInsights"> }).catch(() => {
        // Non-blocking usage tracking.
      });
    }
    setOpen(false);
    setQuery("");
    router.push(item.route);
  };

  const onInputKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(items.length, 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = items[selectedIndex];
      if (selected) {
        await runItem(selected);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm px-4 pt-[12vh]">
      <div ref={panelRef} className="mx-auto w-full max-w-2xl card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 px-3 py-2.5">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => void onInputKeyDown(event)}
            placeholder="Search saved insights, ideas, mentorship..."
            className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
          />
          <kbd className="inline-flex items-center gap-0.5 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-1.5 py-0.5 text-[10px] text-stone-500">
            <Command className="w-3 h-3" />
            K
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-stone-500">
              No results.
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => (
                <button
                  key={item.key}
                  onClick={() => void runItem(item)}
                  className={`w-full text-left rounded-md px-3 py-2 transition-colors ${selectedIndex === index
                      ? "bg-stone-100 dark:bg-stone-800"
                      : "hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {item.title}
                    </p>
                    {item.priority && (
                      <span className="text-[10px] uppercase text-stone-400">
                        {item.priority}
                      </span>
                    )}
                    <span className="text-[10px] uppercase text-stone-400">
                      {labelForKind(item.kind)}
                    </span>
                    <CornerDownLeft className="w-3.5 h-3.5 text-stone-300 ml-auto" />
                  </div>
                  <p className="text-xs text-stone-500 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function labelForKind(kind: PaletteItem["kind"]): string {
  switch (kind) {
    case "savedInsight":
      return "Saved";
    case "idea":
      return "Idea";
    case "mentorship":
      return "Mentor";
    case "income":
      return "Income";
    case "navigation":
      return "Page";
    default:
      return kind;
  }
}
