"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Send,
  Loader2,
  Plus,
  ChevronDown,
  Trash2,
  Square,
  Mail,
  Calendar,
  GitPullRequest,
  Brain,
  Zap,
} from "lucide-react";
import { MessageStream } from "./MessageStream";
import { ToolCallCard } from "./ToolCallCard";
import type { SSEEvent } from "../../lib/agentTypes";

interface Message {
  _id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolInput?: string;
  toolOutput?: string;
  toolStatus?: "running" | "done" | "error";
  createdAt: number;
}

interface Thread {
  _id: string;
  title: string;
  agentSessionId?: string;
  lastMessageAt: number;
}

function shouldNotifyUrgent(text: string): boolean {
  if (!text) return false;
  return /(urgent|asap|action required|immediately|critical)/i.test(text);
}

export default function JarvisChat() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingTools, setStreamingTools] = useState<
    Array<{
      name: string;
      input: string;
      output?: string;
      status: "running" | "done" | "error";
    }>
  >([]);
  const [showThreads, setShowThreads] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingPromptRef = useRef<string | null>(null);

  const threads = useQuery(api.messages.listThreads, {}) as
    | Thread[]
    | undefined;
  const messages = useQuery(
    api.messages.listMessages,
    activeThreadId ? { threadId: activeThreadId as string } : "skip"
  ) as Message[] | undefined;

  const createThread = useMutation(api.messages.createThread);
  const addUserMessage = useMutation(api.messages.addUserMessage);
  const addAssistantMessage = useMutation(api.messages.addAssistantMessage);
  const updateThreadSession = useMutation(api.messages.updateThreadSession);
  const deleteThread = useMutation(api.messages.deleteThread);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streamingTools]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const startNewThread = useCallback(async () => {
    const id = await createThread({ title: "New conversation" });
    setActiveThreadId(id as string);
    setShowThreads(false);
  }, [createThread]);

  // Auto-create thread on first load
  useEffect(() => {
    if (!activeThreadId && threads !== undefined) {
      if (threads.length > 0) {
        setActiveThreadId(threads[0]._id);
      } else {
        void startNewThread();
      }
    }
  }, [threads, activeThreadId, startNewThread]);

  const sendMessage = useCallback(async () => {
    const text = pendingPromptRef.current || input.trim();
    pendingPromptRef.current = null;
    if (!text || isStreaming || !activeThreadId) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await addUserMessage({
      threadId: activeThreadId as string,
      content: text,
    });

    const currentThread = threads?.find((t) => t._id === activeThreadId);
    const sessionId = currentThread?.agentSessionId;

    setIsStreaming(true);
    setStreamingContent("");
    setStreamingTools([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThreadId,
          message: text,
          sessionId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Agent server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResponse = "";
      let newSessionId = sessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: SSEEvent;
          try {
            event = JSON.parse(line.slice(6)) as SSEEvent;
          } catch {
            continue;
          }

          switch (event.type) {
            case "session_init":
              newSessionId = event.sessionId;
              break;

            case "text":
              finalResponse += event.content;
              setStreamingContent((prev) => prev + event.content);
              break;

            case "tool_start":
              setStreamingTools((prev) => [
                ...prev,
                {
                  name: event.toolName,
                  input: event.toolInput,
                  status: "running",
                },
              ]);
              break;

            case "tool_done":
            case "tool_error":
              setStreamingTools((prev) =>
                prev.map((t) =>
                  t.name === event.toolName && t.status === "running"
                    ? {
                        ...t,
                        output: (event as { toolOutput?: string }).toolOutput,
                        status:
                          event.type === "tool_done" ? "done" : "error",
                      }
                    : t
                )
              );
              break;

            case "done":
              finalResponse = event.content || finalResponse;
              if (
                typeof window !== "undefined" &&
                document.visibilityState !== "visible" &&
                localStorage.getItem("jarvis:web-notifications-enabled") ===
                  "true" &&
                "Notification" in window &&
                Notification.permission === "granted" &&
                shouldNotifyUrgent(finalResponse)
              ) {
                new Notification("Jarvis: Urgent update", {
                  body: finalResponse.slice(0, 180),
                });
              }
              break;

            case "error":
              throw new Error(event.error);
          }
        }
      }

      if (finalResponse) {
        await addAssistantMessage({
          threadId: activeThreadId as string,
          content: finalResponse,
        });
      }

      if (newSessionId && newSessionId !== sessionId) {
        await updateThreadSession({
          threadId: activeThreadId as string,
          agentSessionId: newSessionId,
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const msg =
          err instanceof Error ? err.message : "Something went wrong";
        await addAssistantMessage({
          threadId: activeThreadId as string,
          content: `Error: ${msg}`,
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      setStreamingTools([]);
      abortRef.current = null;
    }
  }, [
    input,
    isStreaming,
    activeThreadId,
    threads,
    addUserMessage,
    addAssistantMessage,
    updateThreadSession,
  ]);

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const handlePromptClick = useCallback(
    (text: string) => {
      pendingPromptRef.current = text;
      setInput(text);
      void sendMessage();
    },
    [sendMessage]
  );

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      await deleteThread({ threadId: threadId as any });
      if (activeThreadId === threadId) {
        const remaining = threads?.filter((t) => t._id !== threadId);
        if (remaining && remaining.length > 0) {
          setActiveThreadId(remaining[0]._id);
        } else {
          setActiveThreadId(null);
        }
      }
      setShowThreads(false);
    },
    [deleteThread, activeThreadId, threads]
  );

  const allMessages: Message[] = messages ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="relative flex items-center gap-2 px-4 py-2.5 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-950">
        <button
          onClick={() => setShowThreads(!showThreads)}
          className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 font-medium min-w-0 transition-colors"
        >
          <span className="truncate max-w-[180px] sm:max-w-xs">
            {threads?.find((t) => t._id === activeThreadId)?.title ??
              "Conversation"}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${showThreads ? "rotate-180" : ""}`}
          />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={startNewThread}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Thread list dropdown */}
        {showThreads && (
          <div className="absolute top-full left-0 right-0 sm:left-4 sm:right-auto sm:w-80 z-30 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl shadow-stone-200/40 dark:shadow-black/40 overflow-hidden">
            <div className="p-1.5 space-y-0.5 max-h-80 overflow-y-auto">
              {threads?.length ? (
                threads.map((thread) => (
                  <div
                    key={thread._id}
                    className={`group flex items-center rounded-lg transition-colors ${
                      activeThreadId === thread._id
                        ? "bg-blue-600/10"
                        : "hover:bg-stone-50 dark:hover:bg-stone-800/80"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveThreadId(thread._id);
                        setShowThreads(false);
                      }}
                      className="flex-1 text-left px-3 py-2 min-w-0"
                    >
                      <div
                        className={`truncate text-sm font-medium ${
                          activeThreadId === thread._id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {thread.title}
                      </div>
                      <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                        {new Date(thread.lastMessageAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteThread(thread._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500 text-center">
                  No conversations yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {allMessages.length === 0 && !isStreaming && (
          <WelcomeState onSend={handlePromptClick} />
        )}

        {allMessages.map((msg) => (
          <ChatMessage key={msg._id} message={msg} />
        ))}

        {/* Streaming state */}
        {isStreaming && (
          <>
            {streamingTools.map((tool, i) => (
              <ToolCallCard key={i} tool={tool} />
            ))}
            {streamingContent && (
              <div className="flex gap-3">
                <AgentAvatar />
                <div className="flex-1 min-w-0">
                  <MessageStream content={streamingContent} />
                </div>
              </div>
            )}
            {!streamingContent && streamingTools.length === 0 && (
              <div className="flex gap-3 items-center">
                <AgentAvatar />
                <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking\u2026</span>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-950">
        <div className="flex items-end gap-2 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 focus-within:border-blue-500/50 focus-within:shadow-sm focus-within:shadow-blue-500/5 transition-all px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jarvis anything\u2026"
            rows={1}
            className="flex-1 bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-base sm:text-sm resize-none outline-none min-h-[28px] max-h-40 leading-relaxed py-0.5"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex-shrink-0 p-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 transition-colors mb-0.5"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim()}
              className="flex-shrink-0 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-stone-200 dark:disabled:bg-stone-700 disabled:text-stone-400 dark:disabled:text-stone-500 text-white transition-colors mb-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-stone-400 dark:text-stone-600 text-center mt-1.5">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  if (message.role === "tool") {
    return (
      <ToolCallCard
        tool={{
          name: message.toolName ?? "unknown",
          input: message.toolInput ?? "",
          output: message.toolOutput,
          status: message.toolStatus ?? "done",
        }}
      />
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm shadow-blue-600/10">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AgentAvatar />
      <div className="flex-1 min-w-0">
        <MessageStream content={message.content} />
      </div>
    </div>
  );
}

function AgentAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-600/15 dark:from-blue-500/20 dark:to-blue-600/20 border border-blue-500/20 dark:border-blue-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    </div>
  );
}

const PROMPT_CHIPS = [
  {
    icon: Mail,
    text: "Check my email for anything urgent",
    color: "text-red-500 dark:text-red-400",
  },
  {
    icon: Calendar,
    text: "What's on my calendar today?",
    color: "text-amber-500 dark:text-amber-400",
  },
  {
    icon: GitPullRequest,
    text: "Summarize my open GitHub PRs",
    color: "text-purple-500 dark:text-purple-400",
  },
  {
    icon: Brain,
    text: "What do you remember about me?",
    color: "text-blue-500 dark:text-blue-400",
  },
];

function WelcomeState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-5 shadow-lg shadow-blue-600/20">
        <Zap className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
        How can I help?
      </h2>
      <p className="text-stone-500 text-sm mb-8 max-w-xs">
        I can check your email, calendar, GitHub, and more.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md px-4">
        {PROMPT_CHIPS.map(({ icon: Icon, text, color }) => (
          <button
            key={text}
            onClick={() => onSend(text)}
            className="flex items-center gap-2.5 text-left px-3.5 py-3 rounded-xl bg-stone-50 dark:bg-stone-900/80 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/60 hover:border-stone-300 dark:hover:border-stone-600 text-sm text-stone-600 dark:text-stone-300 transition-all"
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
