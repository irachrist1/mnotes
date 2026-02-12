"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, MessageSquare, Sparkles, Plus, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationCard } from "./ConfirmationCard";
import { MarkdownMessage } from "@/components/ui/MarkdownMessage";
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
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentThreadId, setCurrentThreadId] = useState<Id<"chatThreads"> | null>(null);
  const [showThreadList, setShowThreadList] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [committingId, setCommittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevSoulVersionRef = useRef<number | null>(null);
  const threadInitRef = useRef(false);

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
      createThread().then(({ threadId }) => setCurrentThreadId(threadId)).catch(() => {});
    }
  }, [open, threads, createThread]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Soul file version watcher — toast when AI evolves the profile
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

    // Ensure we have a thread
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

    setInput("");
    setSending(true);
    setError(null);

    try {
      await sendMessage({ message: text, threadId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
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

  const handleConfirm = async (messageId: Id<"chatMessages">) => {
    setCommittingId(messageId);
    try {
      await commitIntent({ messageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setCommittingId(null);
    }
  };

  const handleReject = async (messageId: Id<"chatMessages">) => {
    try {
      await rejectIntent({ messageId });
    } catch (err) {
      console.error("Failed to reject intent:", err);
    }
  };

  const currentThread = threads?.find((t) => t._id === currentThreadId);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[min(600px,calc(100vh-8rem))] flex flex-col rounded-2xl shadow-2xl dark:shadow-none overflow-hidden"
          style={{
            background: "rgb(var(--color-surface))",
            border: "1px solid rgb(var(--color-border))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-white/[0.06] shrink-0">
            {/* Thread title / dropdown toggle */}
            <button
              onClick={() => setShowThreadList((v) => !v)}
              className="flex items-center gap-2 min-w-0 hover:opacity-70 transition-opacity duration-150"
              aria-label="Toggle conversation list"
            >
              <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[140px]">
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
                className="btn-icon w-7 h-7"
                aria-label="New chat"
                title="New chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="btn-icon w-7 h-7" aria-label="Close chat">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thread list (collapsible) */}
          <AnimatePresence>
            {showThreadList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="border-b border-stone-200 dark:border-white/[0.06] overflow-hidden shrink-0"
              >
                <div className="max-h-48 overflow-y-auto py-1">
                  {(!threads || threads.length === 0) && (
                    <p className="text-xs text-stone-400 px-4 py-3 text-center">
                      No conversations yet
                    </p>
                  )}
                  {threads?.map((thread) => (
                    <div
                      key={thread._id}
                      onClick={() => {
                        setCurrentThreadId(thread._id);
                        setShowThreadList(false);
                      }}
                      className={`group flex items-center justify-between gap-2 px-4 py-2.5 cursor-pointer transition-colors duration-150 ${
                        thread._id === currentThreadId
                          ? "bg-blue-50 dark:bg-blue-500/[0.08]"
                          : "hover:bg-stone-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium truncate ${
                          thread._id === currentThreadId
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-stone-700 dark:text-stone-300"
                        }`}>
                          {thread.title}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 tabular-nums mt-0.5">
                          {relativeTime(thread.lastMessageAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => void handleDeleteThread(e, thread._id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-red-500 transition-colors duration-150"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {(!messages || messages.length === 0) && !sending && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-stone-400" />
                </div>
                <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  Chat with MNotes
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-[240px]">
                  Tell it about a deal you closed, an idea you had, or ask how your business is doing.
                </p>
              </div>
            )}

            {messages?.map((msg) => (
              <div key={msg._id} className="space-y-2">
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 rounded-br-md"
                        : "bg-stone-100 dark:bg-white/[0.06] text-stone-800 dark:text-stone-200 rounded-bl-md"
                    }`}
                  >
                    <MarkdownMessage content={msg.content} />
                  </div>
                </div>

                {msg.intent && msg.intentStatus && (
                  <div className="pl-0 pr-4">
                    <ConfirmationCard
                      intent={msg.intent as {
                        table: string;
                        operation: "create" | "update" | "query";
                        data?: Record<string, unknown>;
                      }}
                      status={msg.intentStatus}
                      onConfirm={() => void handleConfirm(msg._id)}
                      onReject={() => void handleReject(msg._id)}
                      loading={committingId === msg._id}
                    />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-stone-100 dark:bg-white/[0.06] rounded-xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 overflow-hidden shrink-0"
              >
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400 mb-2">
                  {error}
                  <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                placeholder="Tell MNotes something..."
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
