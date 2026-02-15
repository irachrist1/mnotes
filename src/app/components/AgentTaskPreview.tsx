'use client'

import { useEffect, useMemo, useState } from "react";

type Frame = {
  progress: number;
  activeStep: number;
  status: "running" | "ready";
  currentAction: string;
  sources: string[];
  output: string;
};

const PLAN_ITEMS = [
  "Understand constraints and desired outcome",
  "Search relevant context and sources",
  "Analyze findings and draft output",
  "Review, summarize, and deliver",
] as const;

export default function AgentTaskPreview() {
  const frames: Frame[] = useMemo(
    () => [
      {
        progress: 18,
        activeStep: 0,
        status: "running",
        currentAction: "Reading your memory and goals...",
        sources: ["Soul file loaded"],
        output: "",
      },
      {
        progress: 38,
        activeStep: 1,
        status: "running",
        currentAction: "Searching for pricing benchmarks...",
        sources: ["Soul file loaded", "Market data indexed"],
        output: "",
      },
      {
        progress: 55,
        activeStep: 1,
        status: "running",
        currentAction: "Found 3 relevant sources",
        sources: ["Soul file loaded", "Market data indexed", "Competitor analysis found"],
        output: "",
      },
      {
        progress: 72,
        activeStep: 2,
        status: "running",
        currentAction: "Drafting retainer proposal...",
        sources: ["Soul file loaded", "Market data indexed", "Competitor analysis found"],
        output: "Based on your positioning as a premium consultancy...",
      },
      {
        progress: 88,
        activeStep: 2,
        status: "running",
        currentAction: "Polishing output...",
        sources: ["Soul file loaded", "Market data indexed", "Competitor analysis found"],
        output: "Based on your positioning, I recommend a 3-tier retainer: $2,500/mo (advisory), $5,000/mo (hands-on), $10,000/mo (embedded)...",
      },
      {
        progress: 100,
        activeStep: 3,
        status: "ready",
        currentAction: "Output ready for review",
        sources: ["Soul file loaded", "Market data indexed", "Competitor analysis found"],
        output: "Based on your positioning, I recommend a 3-tier retainer: $2,500/mo (advisory), $5,000/mo (hands-on), $10,000/mo (embedded). Each tier includes...",
      },
    ],
    []
  );

  const [frameIndex, setFrameIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile to pause animation (height changes cause scroll jumps)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // On mobile, show the final "ready" frame statically
  const frame = isMobile ? frames[frames.length - 1]! : frames[frameIndex]!;

  useEffect(() => {
    if (isMobile) return; // No animation on mobile

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const delayMs = frameIndex === frames.length - 1 ? 2400 : 1600;
      timeout = setTimeout(() => {
        if (cancelled) return;
        setFrameIndex((i) => (i + 1) % frames.length);
      }, delayMs);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [frameIndex, frames.length, isMobile]);

  return (
    <div className="relative">
      {/* Glow */}
      <div
        className="absolute -inset-4 bg-gradient-to-br from-blue-600/15 via-blue-500/10 to-purple-500/10 blur-2xl rounded-3xl"
        aria-hidden="true"
      />

      <div className="relative card p-0 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/60 dark:border-white/[0.06] bg-stone-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${frame.status === "ready" ? "bg-emerald-500" : "bg-blue-500 animate-pulse"}`} />
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Draft retainer proposal for next client
            </p>
          </div>
          <span className={`text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-full ${
            frame.status === "ready"
              ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
          }`}>
            {frame.status === "ready" ? "Ready" : `${frame.progress}%`}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Progress bar */}
          <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                frame.status === "ready"
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : "bg-blue-600 dark:bg-blue-400"
              }`}
              style={{ width: `${frame.progress}%` }}
            />
          </div>

          {/* Plan steps */}
          <div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2.5">
              Plan
            </p>
            <div className="space-y-2">
              {PLAN_ITEMS.map((s, i) => {
                const done = i < frame.activeStep || frame.status === "ready";
                const active = i === frame.activeStep && frame.status !== "ready";

                return (
                  <div
                    key={s}
                    className="flex items-center gap-2.5"
                  >
                    {done ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z" />
                      </svg>
                    ) : active ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-stone-600 shrink-0" />
                    )}
                    <span className={`text-xs ${
                      done
                        ? "text-stone-500 dark:text-stone-400"
                        : active
                          ? "text-stone-900 dark:text-stone-100 font-medium"
                          : "text-stone-400 dark:text-stone-500"
                    }`}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live action indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.04]">
            {frame.status !== "ready" && (
              <div className="flex gap-0.5 shrink-0">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-[pulse_1.2s_ease-in-out_infinite]" />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-[pulse_1.2s_ease-in-out_0.2s_infinite]" />
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-[pulse_1.2s_ease-in-out_0.4s_infinite]" />
              </div>
            )}
            <span className={`text-xs ${frame.status === "ready" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-stone-600 dark:text-stone-400"}`}>
              {frame.currentAction}
            </span>
          </div>

          {/* Sources */}
          {frame.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {frame.sources.map((src) => (
                <span
                  key={src}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-400"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor" opacity="0.6">
                    <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                  </svg>
                  {src}
                </span>
              ))}
            </div>
          )}

          {/* Output preview */}
          {frame.output && (
            <div className="rounded-lg bg-blue-50/50 dark:bg-blue-500/[0.04] border border-blue-200/50 dark:border-blue-500/[0.08] p-3">
              <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                {frame.status === "ready" ? "Output" : "Draft"}
              </p>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {frame.output}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
