"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Send, Loader2, Plus, ChevronDown, Trash2 } from "lucide-react";
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
  model?: string;
  lastMessageAt: number;
}

// ── Model catalogue ────────────────────────────────────────────────────────────

const CHAT_MODELS = [
  {
    group: "Claude",
    note: "works with subscription",
    provider: "anthropic" as const,
    models: [
      { value: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5", description: "Fast, default" },
      { value: "claude-opus-4-6", label: "Opus 4.6", description: "Most powerful" },
    ],
  },
  {
    group: "Gemini",
    note: "requires Google API key",
    provider: "google" as const,
    models: [
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", description: "Newest, fast" },
      { value: "gemini-3-pro-preview", label: "Gemini 3 Pro", description: "Newest, powerful" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Stable" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Deep reasoning" },
    ],
  },
] as const;

function modelShortLabel(modelId: string | undefined): string | undefined {
  if (!modelId) return undefined;
  for (const group of CHAT_MODELS) {
    const found = group.models.find((m) => m.value === modelId);
    if (found) return `${group.group} · ${found.label}`;
  }
  // Fallback: strip date suffix from raw model IDs (e.g. claude-sonnet-4-5-20250929)
  return modelId.replace(/-\d{8}$/, "");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function friendlyToolStatus(toolName: string): string {
  if (!toolName) return "Working…";
  const name = toolName.toLowerCase();
  if (name === "websearch") return "Searching the web…";
  if (name === "webfetch") return "Fetching page…";
  if (name === "bash") return "Running command…";
  if (name === "read") return "Reading file…";
  if (name === "write") return "Writing file…";
  if (name === "edit") return "Editing file…";
  if (name === "glob") return "Searching files…";
  if (name === "grep") return "Searching code…";
  if (name.startsWith("mcp__gmail")) return "Checking email…";
  if (name.startsWith("mcp__calendar")) return "Checking calendar…";
  if (name.startsWith("mcp__outlook")) return "Checking Outlook…";
  if (name.startsWith("mcp__github")) return "Checking GitHub…";
  if (name.startsWith("mcp__memory")) return "Accessing memory…";
  if (name.startsWith("mcp__")) return "Using integration…";
  return "Working…";
}

function shouldNotifyUrgent(text: string): boolean {
  if (!text) return false;
  return /(urgent|asap|action required|immediately|critical)/i.test(text);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function JarvisChat() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingModel, setStreamingModel] = useState("");
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [streamingTools, setStreamingTools] = useState<Array<{
    id?: string;
    name: string;
    input: string;
    output?: string;
    status: "running" | "done" | "error";
  }>>([]);
  const [showThreads, setShowThreads] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadDropdownRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const threads = useQuery(api.messages.listThreads, {}) as Thread[] | undefined;
  const messages = useQuery(
    api.messages.listMessages,
    activeThreadId ? { threadId: activeThreadId as string } : "skip"
  ) as Message[] | undefined;

  const createThread = useMutation(api.messages.createThread);
  const deleteThread = useMutation(api.messages.deleteThread);
  const updateThreadTitle = useMutation(api.messages.updateThreadTitle);
  const addUserMessage = useMutation(api.messages.addUserMessage);
  const addAssistantMessage = useMutation(api.messages.addAssistantMessage);
  const updateThreadSession = useMutation(api.messages.updateThreadSession);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streamingTools]);

  // Close thread dropdown when clicking outside
  useEffect(() => {
    if (!showThreads) return;
    function handleClickOutside(e: MouseEvent) {
      if (threadDropdownRef.current && !threadDropdownRef.current.contains(e.target as Node)) {
        setShowThreads(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showThreads]);

  // Close model picker when clicking outside
  useEffect(() => {
    if (!showModelPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModelPicker]);

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

  const handleDeleteThread = useCallback(async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteThread({ threadId: threadId as string });
    if (activeThreadId === threadId) {
      const remaining = (threads ?? []).filter((t) => t._id !== threadId);
      if (remaining.length > 0) {
        setActiveThreadId(remaining[0]._id);
      } else {
        const id = await createThread({ title: "New conversation" });
        setActiveThreadId(id as string);
      }
    }
  }, [deleteThread, createThread, activeThreadId, threads]);

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
    if (!input.trim() || isStreaming || !activeThreadId) return;

    const userText = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Save user message
    await addUserMessage({ threadId: activeThreadId as string, content: userText });

    // Auto-name the thread from the first message if it's still untitled
    const currentThread = threads?.find((t) => t._id === activeThreadId);
    if (currentThread?.title === "New conversation") {
      const autoTitle = userText.slice(0, 60).replace(/\s+/g, " ").trim();
      void updateThreadTitle({ threadId: activeThreadId as string, title: autoTitle });
    }

    const sessionId = currentThread?.agentSessionId;

    // Reset streaming state
    setIsStreaming(true);
    setStreamingStatus("Connecting…");
    setStreamingContent("");
    setStreamingModel("");
    setStreamingTools([]);
    setActivityExpanded(false);

    const controller = new AbortController();
    abortRef.current = controller;

    let respondedModelLocal = "";

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThreadId,
          message: userText,
          sessionId,
          ...(selectedModel ? { modelOverride: selectedModel } : {}),
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
      let doneReceived = false;

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
              respondedModelLocal = event.model ?? "";
              setStreamingModel(event.model ?? "");
              setStreamingStatus("Thinking…");
              break;

            case "text":
              // Collapse activity panel when text starts flowing (like Claude.ai / Perplexity)
              setActivityExpanded(false);
              setStreamingStatus("Responding…");
              finalResponse += event.content;
              setStreamingContent((prev) => prev + event.content);
              break;

            case "tool_start":
              // Auto-expand to show what's happening (like Perplexity's search steps)
              setActivityExpanded(true);
              setStreamingStatus(friendlyToolStatus(event.toolName));
              setStreamingTools((prev) => [
                ...prev,
                { id: event.messageId, name: event.toolName, input: event.toolInput, status: "running" },
              ]);
              break;

            case "tool_done":
            case "tool_error":
              setStreamingStatus("Thinking…");
              setStreamingTools((prev) =>
                prev.map((t) =>
                  (event.messageId ? t.id === event.messageId : t.name === event.toolName) && t.status === "running"
                    ? { ...t, output: event.toolOutput, status: event.type === "tool_done" ? "done" : "error" }
                    : t
                )
              );
              break;

            case "done":
              doneReceived = true;
              setStreamingStatus("");
              finalResponse = event.content || finalResponse;
              if (
                typeof window !== "undefined" &&
                document.visibilityState !== "visible" &&
                localStorage.getItem("jarvis:web-notifications-enabled") === "true" &&
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
              setStreamingStatus("");
              throw new Error(event.error);
          }
        }
      }

      // Guard against silent failure — stream closed without done/error
      if (!doneReceived && !controller.signal.aborted) {
        throw new Error("Agent stopped unexpectedly. Check that `npm run agent` is running and check its terminal for errors.");
      }

      // Persist final response + update session ID + model
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
          ...(respondedModelLocal ? { model: respondedModelLocal } : {}),
        });
      } else if (respondedModelLocal && respondedModelLocal !== currentThread?.model) {
        // Session ID unchanged but model changed — still persist it
        await updateThreadSession({
          threadId: activeThreadId as string,
          agentSessionId: sessionId ?? newSessionId ?? "",
          model: respondedModelLocal,
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        await addAssistantMessage({
          threadId: activeThreadId as string,
          content: `Error: ${msg}`,
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingStatus("");
      setStreamingModel("");
      setStreamingContent("");
      setStreamingTools([]);
      setActivityExpanded(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, activeThreadId, threads, selectedModel, addUserMessage, addAssistantMessage, updateThreadSession, updateThreadTitle]);

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const allMessages: Message[] = messages ?? [];
  const activeThread = threads?.find((t) => t._id === activeThreadId);

  // Label shown in the model picker button
  const pickerLabel = selectedModel
    ? modelShortLabel(selectedModel)
    : activeThread?.model
      ? modelShortLabel(activeThread.model)
      : "Default model";

  return (
    <div className="flex flex-col h-full">
      {/* ── Thread header ──────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
        <div ref={threadDropdownRef} className="relative min-w-0">
          <button
            onClick={() => setShowThreads(!showThreads)}
            className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 font-medium min-w-0"
          >
            <span className="truncate max-w-[180px] sm:max-w-xs">
              {activeThread?.title ?? "Conversation"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${showThreads ? "rotate-180" : ""}`} />
          </button>

          {/* Thread list dropdown */}
          {showThreads && (
            <div className="absolute top-8 left-0 w-[calc(100vw-2rem)] sm:w-72 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
                {threads?.length ? (
                  threads.map((thread) => (
                    <div
                      key={thread._id}
                      className={`
                        group flex items-center gap-1 rounded-lg text-sm transition-colors
                        ${activeThreadId === thread._id
                          ? "bg-blue-600/10 text-blue-600 dark:text-blue-400"
                          : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100"
                        }
                      `}
                    >
                      <button
                        onClick={() => {
                          setActiveThreadId(thread._id);
                          setShowThreads(false);
                        }}
                        className="flex-1 min-w-0 text-left px-3 py-2"
                      >
                        <div className="truncate font-medium">{thread.title}</div>
                        <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                          {new Date(thread.lastMessageAt).toLocaleDateString()}
                        </div>
                      </button>
                      <button
                        onClick={(e) => void handleDeleteThread(thread._id, e)}
                        className="flex-shrink-0 p-1.5 mr-1 rounded-md opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500 text-center">No conversations yet</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* ── Model picker ── */}
          <div ref={modelPickerRef} className="relative">
            <button
              onClick={() => setShowModelPicker((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <span className="hidden sm:inline max-w-[120px] truncate">{pickerLabel}</span>
              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 top-9 w-64 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-2 space-y-3">
                  {CHAT_MODELS.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 pb-1 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide flex items-baseline gap-1.5">
                        {group.group}
                        <span className="font-normal normal-case text-stone-300 dark:text-stone-600">{group.note}</span>
                      </div>
                      {group.models.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => { setSelectedModel(m.value); setShowModelPicker(false); }}
                          className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedModel === m.value
                              ? "bg-blue-600/10 text-blue-600 dark:text-blue-400"
                              : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                          }`}
                        >
                          <span>{m.label}</span>
                          <span className="text-xs text-stone-400 dark:text-stone-500">{m.description}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                  {selectedModel && (
                    <div className="border-t border-stone-100 dark:border-stone-800 pt-1">
                      <button
                        onClick={() => { setSelectedModel(""); setShowModelPicker(false); }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        Use default from Settings
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startNewThread}
            className="p-1.5 rounded-lg text-stone-400 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {allMessages.length === 0 && !isStreaming && (
          <WelcomeState onSend={(text) => { setInput(text); void sendMessage(); }} />
        )}

        {allMessages.map((msg) => (
          <ChatMessage key={msg._id} message={msg} threadModel={activeThread?.model} />
        ))}

        {/* Streaming state */}
        {isStreaming && (
          <>
            <AgentActivityBar
              status={streamingStatus}
              tools={streamingTools}
              expanded={activityExpanded}
              onToggle={() => setActivityExpanded((v) => !v)}
            />
            {streamingContent && (
              <div className="flex gap-3">
                <AgentAvatar />
                <div className="flex-1 min-w-0">
                  <MessageStream content={streamingContent} />
                  {streamingModel && (
                    <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">{modelShortLabel(streamingModel)}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
        <div className="flex items-end gap-2 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 focus-within:border-blue-500/50 transition-colors px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jarvis anything…"
            rows={1}
            className="flex-1 bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-base sm:text-sm resize-none outline-none min-h-[28px] max-h-40 leading-relaxed py-0.5"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex-shrink-0 p-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 transition-colors mb-0.5"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
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
        <p className="text-xs text-stone-400 dark:text-stone-600 text-center mt-2">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AgentActivityBar({
  status,
  tools,
  expanded,
  onToggle,
}: {
  status: string;
  tools: Array<{ id?: string; name: string; input: string; output?: string; status: "running" | "done" | "error" }>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasTools = tools.length > 0;
  const runningCount = tools.filter((t) => t.status === "running").length;

  return (
    <div className="flex gap-3">
      <AgentAvatar />
      <div className="flex-1 min-w-0">
        <button
          onClick={() => hasTools && onToggle()}
          className={`flex items-center gap-2 text-sm text-stone-400 dark:text-stone-500 ${hasTools ? "cursor-pointer hover:text-stone-600 dark:hover:text-stone-400" : "cursor-default"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
          <span>{status || "Connecting…"}</span>
          {hasTools && (
            <>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span className="text-xs">
                {runningCount > 0
                  ? `${runningCount} running`
                  : `${tools.length} step${tools.length !== 1 ? "s" : ""}`}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </>
          )}
        </button>
        {expanded && hasTools && (
          <div className="mt-2 space-y-2">
            {tools.map((tool, i) => (
              <ToolCallCard key={tool.id ?? i} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessage({ message, threadModel }: { message: Message; threadModel?: string }) {
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
        <div className="max-w-[85%] sm:max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
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
        {threadModel && (
          <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500">{modelShortLabel(threadModel)}</p>
        )}
      </div>
    </div>
  );
}

function AgentAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-blue-600/15 dark:bg-blue-600/20 border border-blue-600/25 dark:border-blue-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">J</span>
    </div>
  );
}

function WelcomeState({ onSend }: { onSend: (text: string) => void }) {
  const PROMPTS = [
    "Check my email for anything urgent",
    "What's on my calendar today?",
    "Summarize my open GitHub PRs",
    "What do you remember about me?",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-4">
        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">J</span>
      </div>
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-2">How can I help?</h2>
      <p className="text-stone-500 text-sm mb-8 max-w-xs">
        I can check your email, calendar, GitHub, and more.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSend(prompt)}
            className="text-left px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-300 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
