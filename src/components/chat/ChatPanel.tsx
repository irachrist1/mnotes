"use client";

import type { CSSProperties, RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Send, X, MessageSquare, Sparkles, Plus, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationCard } from "./ConfirmationCard";
import { MarkdownMessage } from "@/components/ui/LazyMarkdownMessage";
import { track } from "@/lib/analytics";
import type { Id } from "@convex/_generated/dataModel";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ChatPanel({
  open,
  onClose,
  pendingPrompt,
  onPromptConsumed,
  inline = false,
}: {
  open: boolean;
  onClose: () => void;
  pendingPrompt?: string | null;
  onPromptConsumed?: () => void;
  inline?: boolean;
}) {
  const [currentThreadId, setCurrentThreadId] = useState<Id<"chatThreads"> | null>(null);
  const [showThreadList, setShowThreadList] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [committingId, setCommittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimisticUserMsg, setOptimisticUserMsg] = useState<{ id: string; content: string } | null>(null);
  const [vv, setVv] = useState<{ height: number; top: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const threads = useQuery(api.chat.listThreads, open ? {} : "skip");
  const messages = useQuery(
    api.chat.listMessages,
    open && currentThreadId ? { threadId: currentThreadId, limit: 50 } : "skip"
  );
  const soulFile = useQuery(api.soulFile.get, open ? {} : "skip");

  const sendMessage = useAction(api.ai.chatSend.send);
  const commitIntent = useMutation(api.chat.commitIntent);
  const rejectIntent = useMutation(api.chat.rejectIntent);
  const createThread = useMutation(api.chat.createThread);
  const deleteThread = useMutation(api.chat.deleteThread);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevSoulVersionRef = useRef<number | null>(null);
  const threadInitRef = useRef(false);
  const scrollPosRef = useRef(0);
  const threadTapRef = useRef<{ x: number; y: number } | null>(null);
  const threadMovedRef = useRef(false);
  const pinnedToBottomRef = useRef(true);
  const keyboardSyncRafRef = useRef<number | null>(null);

  // Auto-create or auto-select thread when panel first opens
  useEffect(() => {
    if (!open) {
      threadInitRef.current = false;
      return;
    }
    if (threadInitRef.current || threads === undefined) return;
    threadInitRef.current = true;

    if (threads.length > 0) {
      setCurrentThreadId(threads[0]._id);
    } else {
      createThread().then(({ threadId }) => setCurrentThreadId(threadId)).catch(() => { });
    }
  }, [open, threads, createThread]);

  // Consume pendingPrompt from QuickActionCards — pre-fill input and focus
  useEffect(() => {
    if (!pendingPrompt || !open) return;
    setInput(pendingPrompt);
    onPromptConsumed?.();
    // Focus the input after a short delay to let the panel render
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [pendingPrompt, open, onPromptConsumed]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior) => {
      const el = messagesScrollRef.current;
      if (!el) return;
      // Next tick avoids fighting layout while VisualViewport is resizing.
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior });
      });
    },
    []
  );

  // Track whether the user is "pinned" to bottom so we don't yank them while reading history.
  useEffect(() => {
    if (!open) return;
    const el = messagesScrollRef.current;
    if (!el) return;

    const updatePinned = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      pinnedToBottomRef.current = distance < 120;
    };

    updatePinned();
    el.addEventListener("scroll", updatePinned, { passive: true });
    return () => el.removeEventListener("scroll", updatePinned);
  }, [open]);

  // Auto-scroll on new messages or optimistic message
  useEffect(() => {
    if (!open) return;
    if (!pinnedToBottomRef.current) return;
    scrollToBottom(optimisticUserMsg || sending ? "auto" : "smooth");
  }, [messages?.length, open, optimisticUserMsg]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      // Avoid iOS "scroll-to-focus" flicker; user can tap to focus.
      const mq = window.matchMedia("(max-width: 639px)");
      if (mq.matches) return;
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Lock body scroll on mobile when chat is open (iOS-safe) — skip in inline mode
  useEffect(() => {
    if (!open || inline) return;
    const mq = window.matchMedia("(max-width: 639px)");
    if (!mq.matches) return;

    scrollPosRef.current = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.position = "fixed";
    body.style.top = `-${scrollPosRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = "";
      html.style.height = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollPosRef.current);
    };
  }, [open, inline]);

  // VisualViewport sizing: prevents iOS keyboard gaps + "scroll behind" artifacts.
  // Skip in inline mode — parent handles layout.
  useEffect(() => {
    if (!open || inline) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const applyMobile = () => setIsMobile(mq.matches);
    applyMobile();
    mq.addEventListener("change", applyMobile);
    if (!mq.matches) setVv(null);

    const vvp = window.visualViewport;
    if (!vvp) {
      return () => mq.removeEventListener("change", applyMobile);
    }

    const update = () => {
      if (!mq.matches) {
        setVv(null);
        return;
      }
      setVv({
        height: Math.round(vvp.height),
        top: Math.round(vvp.offsetTop),
      });
    };

    update();
    vvp.addEventListener("resize", update);
    vvp.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vvp.removeEventListener("resize", update);
      vvp.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      mq.removeEventListener("change", applyMobile);
    };
  }, [open, inline]);

  // Always land at the bottom when opening (so you can type immediately).
  useEffect(() => {
    if (!open) return;
    pinnedToBottomRef.current = true;
    scrollToBottom("auto");
  }, [open, currentThreadId, scrollToBottom]);

  // Clear optimistic message when real message arrives from Convex
  useEffect(() => {
    if (!optimisticUserMsg || !messages) return;
    const match = messages.some(
      (m) => m.role === "user" && m.content === optimisticUserMsg.content
    );
    if (match) setOptimisticUserMsg(null);
  }, [messages, optimisticUserMsg]);

  // Soul file version watcher
  useEffect(() => {
    if (!open || !soulFile) return;
    const version = soulFile.version;
    if (prevSoulVersionRef.current === null) {
      prevSoulVersionRef.current = version;
      return;
    }
    if (version > prevSoulVersionRef.current) {
      prevSoulVersionRef.current = version;
      toast.success("Your profile just got smarter", {
        description: "Soul file updated with new patterns.",
        duration: 4000,
      });
    }
  }, [soulFile?.version, open]);

  const handleNewChat = async () => {
    try {
      const { threadId } = await createThread();
      setCurrentThreadId(threadId);
      setShowThreadList(false);
      setInput("");
      setError(null);
    } catch {
      // ignore
    }
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: Id<"chatThreads">) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteThread({ threadId });
      if (currentThreadId === threadId) {
        const remaining = threads?.filter((t) => t._id !== threadId) ?? [];
        if (remaining.length > 0) {
          setCurrentThreadId(remaining[0]._id);
        } else {
          const { threadId: newId } = await createThread();
          setCurrentThreadId(newId);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    let threadId = currentThreadId;
    if (!threadId) {
      try {
        const result = await createThread();
        threadId = result.threadId;
        setCurrentThreadId(threadId);
      } catch {
        setError("Failed to create conversation thread");
        return;
      }
    }

    // Show user message instantly (optimistic)
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setOptimisticUserMsg({ id, content: text });
    setInput("");
    setSending(true);
    setError(null);

    try {
      await sendMessage({ message: text, threadId });
      track("chat_message_sent", { threadId: threadId ?? undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      setOptimisticUserMsg(null);
    } finally {
      setSending(false);
    }
  }, [input, sending, sendMessage, currentThreadId, createThread]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const stopKeyboardSync = useCallback(() => {
    if (keyboardSyncRafRef.current !== null) {
      cancelAnimationFrame(keyboardSyncRafRef.current);
      keyboardSyncRafRef.current = null;
    }
  }, []);

  const startKeyboardSync = useCallback(() => {
    stopKeyboardSync();
    if (!isMobile) return;
    const vvp = window.visualViewport;
    if (!vvp) return;

    const start = performance.now();
    const tick = () => {
      // Keep syncing during keyboard animation to prevent transient gaps/flicker.
      setVv({
        height: Math.round(vvp.height),
        top: Math.round(vvp.offsetTop),
      });
      if (performance.now() - start < 450) {
        keyboardSyncRafRef.current = requestAnimationFrame(tick);
      } else {
        keyboardSyncRafRef.current = null;
      }
    };
    keyboardSyncRafRef.current = requestAnimationFrame(tick);
  }, [isMobile, stopKeyboardSync]);

  const handleConfirm = useCallback(async (messageId: Id<"chatMessages">) => {
    setCommittingId(messageId);
    try {
      await commitIntent({ messageId });
      track("chat_intent_committed", { messageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setCommittingId(null);
    }
  }, [commitIntent]);

  const handleReject = useCallback(async (messageId: Id<"chatMessages">) => {
    try {
      await rejectIntent({ messageId });
      track("chat_intent_rejected", { messageId });
    } catch (err) {
      console.error("Failed to reject intent:", err);
    }
  }, [rejectIntent]);

  const handleSuggestion = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  const currentThread = threads?.find((t) => t._id === currentThreadId);

  const renderedMessages = useMemo(() => {
    const base = messages ?? [];
    if (!optimisticUserMsg) return base;
    // Render the optimistic message last; server messages will replace it.
    return [
      ...base,
      {
        _id: optimisticUserMsg.id as unknown as Id<"chatMessages">,
        role: "user" as const,
        content: optimisticUserMsg.content,
        intent: null,
        intentStatus: null,
      },
    ];
  }, [messages, optimisticUserMsg]);

  if (!open) return null;

  const panelStyleMobile: CSSProperties | undefined = isMobile && !inline
    ? vv
      ? { top: vv.top, height: vv.height, bottom: "auto" }
      : { top: 0, height: "100dvh" }
    : undefined;

  const backdropStyleMobile: CSSProperties | undefined =
    vv && !inline ? { top: vv.top, height: vv.height, bottom: "auto" } : undefined;

  // ── Inline mode: renders as a normal flow element filling its parent ──
  if (inline) {
    return (
      <div
        className="flex flex-col overflow-hidden w-full h-full min-h-0 rounded-2xl border border-stone-200 dark:border-white/[0.06]"
        style={{ background: "rgb(var(--color-surface))", overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-white/[0.06] shrink-0">
          <button
            onClick={() => setShowThreadList((v) => !v)}
            className="flex items-center gap-2 min-w-0 hover:opacity-70 transition-opacity duration-150"
            aria-label="Toggle conversation list"
          >
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[200px]">
                {currentThread?.title || "MNotes"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-150 ${showThreadList ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => void handleNewChat()}
              className="btn-icon w-8 h-8"
              aria-label="New chat"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="btn-icon w-8 h-8" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thread list (collapsible) */}
        {showThreadList && (
          <div className="border-b border-stone-200 dark:border-white/[0.06] shrink-0 animate-fade-in">
            <div className="max-h-48 overflow-y-auto py-1">
              {(!threads || threads.length === 0) && (
                <p className="text-xs text-stone-400 px-4 py-3 text-center">
                  No conversations yet
                </p>
              )}
              {threads?.map((thread) => (
                <div
                  key={thread._id}
                  className={`group w-full flex items-center justify-between gap-2 px-4 py-3 transition-colors duration-150 ${thread._id === currentThreadId
                      ? "bg-blue-50 dark:bg-blue-500/[0.08]"
                      : "hover:bg-stone-50 dark:hover:bg-white/[0.04]"
                    }`}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setCurrentThreadId(thread._id);
                      setShowThreadList(false);
                    }}
                  >
                    <p className={`text-xs font-medium truncate ${thread._id === currentThreadId
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-stone-700 dark:text-stone-300"
                      }`}>
                      {thread.title}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 tabular-nums mt-0.5">
                      {relativeTime(thread.lastMessageAt)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => void handleDeleteThread(e, thread._id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded text-stone-400 hover:text-red-500 transition-colors duration-150"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <MessagesView
          messages={renderedMessages}
          rawMessagesLength={messages ? messages.length : null}
          sending={sending}
          committingId={committingId}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onSuggestionClick={handleSuggestion}
          messagesEndRef={messagesEndRef}
          messagesScrollRef={messagesScrollRef}
        />

        {/* Error */}
        {error && (
          <div className="px-4 shrink-0 animate-fade-in">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400 mb-2">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-stone-200 dark:border-white/[0.06] px-3 py-3 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                pinnedToBottomRef.current = true;
                scrollToBottom("smooth");
              }}
              placeholder="Tell me what to do…"
              disabled={sending}
              rows={1}
              className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-white/[0.04] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-white/[0.06] focus:outline-none focus:border-blue-500 transition-colors"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="shrink-0 w-9 h-9 rounded-xl bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 flex items-center justify-center hover:bg-stone-700 dark:hover:bg-white/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Floating overlay mode (default) ──
  return (
    <>
      {/* Backdrop - mobile only, blocks all interaction behind */}
      <div
        className="fixed inset-0 z-[55] bg-black/50 sm:hidden animate-fade-in"
        onClick={onClose}
        style={{ touchAction: "none", ...backdropStyleMobile }}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          "fixed z-[60] flex flex-col overflow-hidden",
          // Mobile: true full-screen
          "inset-0",
          // Desktop: popover
          "sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[400px] sm:max-h-[min(600px,calc(100vh-8rem))] sm:rounded-2xl sm:shadow-2xl",
          // Animation
          "chat-panel-enter",
        ].join(" ")}
        style={{
          background: "rgb(var(--color-surface))",
          borderWidth: "0px",
          /* VisualViewport-driven sizing on mobile prevents keyboard gaps */
          ...panelStyleMobile,
          overscrollBehavior: "contain",
        }}
      >
        {/* Desktop-only border */}
        <div className="hidden sm:block absolute inset-0 rounded-2xl pointer-events-none" style={{ border: "1px solid rgb(var(--color-border))" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-white/[0.06] shrink-0 safe-area-top">
          <button
            onClick={() => setShowThreadList((v) => !v)}
            className="flex items-center gap-2 min-w-0 hover:opacity-70 transition-opacity duration-150"
            aria-label="Toggle conversation list"
          >
            <div className="w-8 h-8 sm:w-7 sm:h-7 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-base sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[180px] sm:max-w-[140px]">
                {currentThread?.title || "MNotes"}
              </span>
              <ChevronDown
                className={`w-4 h-4 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0 transition-transform duration-150 ${showThreadList ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => void handleNewChat()}
              className="btn-icon w-8 h-8 sm:w-7 sm:h-7"
              aria-label="New chat"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="btn-icon w-8 h-8 sm:w-7 sm:h-7" aria-label="Close chat">
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Thread list (collapsible) */}
        {showThreadList && (
          <div className="border-b border-stone-200 dark:border-white/[0.06] shrink-0 animate-fade-in">
            <div className="max-h-48 overflow-y-auto py-1">
              {(!threads || threads.length === 0) && (
                <p className="text-xs text-stone-400 px-4 py-3 text-center">
                  No conversations yet
                </p>
              )}
              {threads?.map((thread) => (
                <div
                  key={thread._id}
                  className={`group w-full flex items-center justify-between gap-2 px-4 py-3 transition-colors duration-150 ${thread._id === currentThreadId
                    ? "bg-blue-50 dark:bg-blue-500/[0.08]"
                    : "active:bg-stone-100 dark:active:bg-white/[0.06]"
                    }`}
                  style={{ touchAction: "manipulation" }}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onPointerDown={(e) => {
                      // Prevent "scroll selects item": only treat as a tap if the finger doesn't move.
                      threadMovedRef.current = false;
                      threadTapRef.current = { x: e.clientX, y: e.clientY };
                    }}
                    onPointerMove={(e) => {
                      if (!threadTapRef.current) return;
                      const dx = Math.abs(e.clientX - threadTapRef.current.x);
                      const dy = Math.abs(e.clientY - threadTapRef.current.y);
                      if (dx > 8 || dy > 8) threadMovedRef.current = true;
                    }}
                    onPointerUp={() => {
                      const moved = threadMovedRef.current;
                      threadTapRef.current = null;
                      threadMovedRef.current = false;
                      if (moved) return;
                      setCurrentThreadId(thread._id);
                      setShowThreadList(false);
                    }}
                    onClick={() => {
                      // Desktop fallback (pointer events aren't always fired the same way).
                      setCurrentThreadId(thread._id);
                      setShowThreadList(false);
                    }}
                  >
                    <p className={`text-xs font-medium truncate ${thread._id === currentThreadId
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-stone-700 dark:text-stone-300"
                      }`}>
                      {thread.title}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 tabular-nums mt-0.5">
                      {relativeTime(thread.lastMessageAt)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => void handleDeleteThread(e, thread._id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded text-stone-400 hover:text-red-500 active:text-red-500 transition-colors duration-150"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <MessagesView
          messages={renderedMessages}
          rawMessagesLength={messages ? messages.length : null}
          sending={sending}
          committingId={committingId}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onSuggestionClick={handleSuggestion}
          messagesEndRef={messagesEndRef}
          messagesScrollRef={messagesScrollRef}
        />

        {/* Error */}
        {error && (
          <div className="px-4 shrink-0 animate-fade-in">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400 mb-2">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-stone-200 dark:border-white/[0.06] px-3 py-3 shrink-0 safe-area-bottom">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                // Pin to bottom and smoothly bring latest messages into view.
                pinnedToBottomRef.current = true;
                startKeyboardSync();
                scrollToBottom("smooth");
              }}
              onBlur={() => {
                stopKeyboardSync();
              }}
              placeholder="Tell me what to do…"
              disabled={sending}
              rows={1}
              className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-stone-50 dark:bg-white/[0.04] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-white/[0.06] focus:outline-none focus:border-blue-500 transition-colors"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="shrink-0 w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 flex items-center justify-center hover:bg-stone-700 dark:hover:bg-white/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const SUGGESTIONS = [
  "Log a deal I just closed",
  "Capture a new idea",
  "Record a mentor session",
];

const MessagesView = memo(function MessagesView({
  messages,
  rawMessagesLength,
  sending,
  committingId,
  onConfirm,
  onReject,
  onSuggestionClick,
  messagesEndRef,
  messagesScrollRef,
}: {
  messages: Array<{
    _id: Id<"chatMessages">;
    role: "user" | "assistant";
    content: string;
    intent?: unknown | null;
    intentStatus?: unknown | null;
  }>;
  rawMessagesLength: number | null;
  sending: boolean;
  committingId: string | null;
  onConfirm: (messageId: Id<"chatMessages">) => void;
  onReject: (messageId: Id<"chatMessages">) => void;
  onSuggestionClick?: (text: string) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messagesScrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={messagesScrollRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
      style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
    >
      {(rawMessagesLength === 0) && !sending && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl bg-stone-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
            <MessageSquare className="w-6 h-6 sm:w-5 sm:h-5 text-stone-400" />
          </div>
          <p className="text-base sm:text-sm font-medium text-stone-600 dark:text-stone-400">
            I&apos;m ready to work
          </p>
          <p className="text-sm sm:text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-[280px] sm:max-w-[240px]">
            Tell it about a deal, an idea, or what to work on next — I&apos;ll handle it.
          </p>
          {onSuggestionClick && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg._id} className="space-y-2">
          <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                ? "bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 rounded-br-md"
                : "bg-stone-100 dark:bg-white/[0.06] text-stone-800 dark:text-stone-200 rounded-bl-md"
                }`}
            >
              {/* Avoid markdown processing for user messages to keep typing/snappiness high. */}
              {msg.role === "user" ? (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              ) : (
                <MarkdownMessage content={msg.content} />
              )}
            </div>
          </div>

          {msg.intent && msg.intentStatus ? (
            <div className="pl-0 pr-4">
              <ConfirmationCard
                intent={msg.intent as {
                  table: string;
                  operation: "create" | "update" | "query";
                  data?: Record<string, unknown>;
                }}
                status={
                  msg.intentStatus as "proposed" | "confirmed" | "rejected" | "committed"
                }
                onConfirm={() => void onConfirm(msg._id)}
                onReject={() => void onReject(msg._id)}
                loading={committingId === msg._id}
              />
            </div>
          ) : null}
        </div>
      ))}

      {sending && (
        <div className="flex justify-start">
          <div className="bg-stone-100 dark:bg-white/[0.06] rounded-xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1.5 items-center h-5">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
});
