"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Check, Key, Settings, CheckCircle2, ListTodo, Target, Loader2 } from "lucide-react";
import { MarkdownMessage } from "@/components/ui/LazyMarkdownMessage";
import { useConvexAvailable } from "@/components/ConvexClientProvider";
import { toast } from "sonner";
import { Select } from "@/components/ui/Select";
import {
  OPENROUTER_MODELS,
  GOOGLE_MODELS,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
} from "@/lib/aiModels";
import { track } from "@/lib/analytics";

// Pre-designed avatar options for the assistant
const AVATARS = [
  { id: "spark", emoji: "⚡", label: "Spark" },
  { id: "brain", emoji: "🧠", label: "Brain" },
  { id: "star", emoji: "✦", label: "Star" },
  { id: "orbit", emoji: "◉", label: "Orbit" },
  { id: "wave", emoji: "〜", label: "Wave" },
  { id: "bolt", emoji: "↯", label: "Bolt" },
] as const;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Phase = "chat" | "setup" | "complete";

function DisconnectedOnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/[0.05] blur-3xl" />
      </div>

      <div className="w-full max-w-[560px] relative z-10">
        <div className="card p-8 shadow-xl dark:shadow-none text-center">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Convex not connected
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
            This deployment is missing{" "}
            <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-xs">
              NEXT_PUBLIC_CONVEX_URL
            </code>
            , so onboarding is disabled.
          </p>
        </div>
      </div>
    </div>
  );
}

function ConnectedOnboardingPage() {
  const router = useRouter();
  const soulFile = useQuery(api.soulFile.get, {});
  const sendOnboard = useAction(api.ai.onboardSend.send);
  const generateGreeting = useAction(api.ai.onboardSend.generateGreeting);
  const initSoul = useMutation(api.soulFile.initializeFromMarkdown);
  const upsertSettings = useMutation(api.userSettings.upsert);

  // Phase state machine: chat → setup → complete
  const [phase, setPhase] = useState<Phase>("chat");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [assistantName, setAssistantName] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [soulFileContent, setSoulFileContent] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted data (live preview)
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [extractedGoal, setExtractedGoal] = useState<string | null>(null);

  // Setup state
  const [provider, setProvider] = useState<"openrouter" | "google">(DEFAULT_PROVIDER);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [apiKey, setApiKey] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const createTasksFromOnboarding = useMutation(api.tasks.createFromOnboarding);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingFetched = useRef(false);

  // Redirect if soul file already exists (only during chat phase — setup phase means we just created it)
  useEffect(() => {
    if (phase === "chat" && soulFile !== undefined && soulFile !== null) {
      router.replace("/dashboard");
    }
  }, [soulFile, router, phase]);

  // Generate the AI's opening message
  useEffect(() => {
    if (greetingFetched.current || greetingLoaded) return;
    greetingFetched.current = true;

    generateGreeting({})
      .then(({ reply }) => {
        setMessages([
          {
            id: "greeting",
            role: "assistant",
            content: reply,
          },
        ]);
        setGreetingLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to generate greeting:", err);
        // Fallback greeting if AI call fails
        setMessages([
          {
            id: "greeting",
            role: "assistant",
            content:
              "Hey! I'm MNotes — your personal AI assistant. Think of me as an extension of your brain: I'll learn about your business, track your goals, organize anything you throw at me, and proactively help you make better decisions.\n\nThis isn't a form — just talk to me like a person. Tell me a bit about yourself. What do you do?",
          },
        ]);
        setGreetingLoaded(true);
      });
  }, [generateGreeting, greetingLoaded]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input when greeting loads
  useEffect(() => {
    if (greetingLoaded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [greetingLoaded]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const priorMessages = messages
        .filter((m) => m.id !== "greeting" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await sendOnboard({
        message: text,
        assistantName: assistantName ?? undefined,
        priorMessages,
      });

      if (result.assistantName && !assistantName) {
        setAssistantName(result.assistantName);
      }

      if (result.soulFileContent) {
        setSoulFileContent(result.soulFileContent);
        // Extract goal from soul file content
        const goalMatch = result.soulFileContent.match(/## Goals\s*\n([\s\S]*?)(?=\n## |$)/);
        if (goalMatch) {
          const firstGoal = goalMatch[1].split("\n").find((l: string) => l.trim().startsWith("-"));
          if (firstGoal) setExtractedGoal(firstGoal.replace(/^-\s*/, "").trim());
        }
      }

      // Accumulate extracted tasks (no duplicates)
      if (result.tasks && result.tasks.length > 0) {
        setExtractedTasks((prev) => {
          const existing = new Set(prev.map((t) => t.toLowerCase()));
          const newTasks = result.tasks.filter((t: string) => !existing.has(t.toLowerCase()));
          return [...prev, ...newTasks];
        });
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.reply,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, assistantName, sendOnboard]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmSoul = async () => {
    if (!soulFileContent) return;
    setConfirming(true);
    // Transition to setup BEFORE creating soul file to prevent the redirect
    // useEffect from firing (it only redirects when phase === "chat")
    setPhase("setup");
    try {
      await initSoul({
        content: soulFileContent,
        assistantName: assistantName ?? undefined,
      });
      // Create extracted tasks so dashboard is never empty
      if (extractedTasks.length > 0) {
        await createTasksFromOnboarding({ tasks: extractedTasks });
      }
      track("onboarding_soul_confirmed", { taskCount: extractedTasks.length });
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setConfirming(false);
      setPhase("chat");
    }
  };

  const handleSaveSettings = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }
    setSavingSettings(true);
    setError(null);
    try {
      await upsertSettings({
        aiProvider: provider,
        aiModel: model,
        ...(provider === "openrouter"
          ? { openrouterApiKey: apiKey.trim() }
          : { googleApiKey: apiKey.trim() }),
      });
      track("onboarding_settings_saved", { provider, model });
      setPhase("complete");
      setTimeout(() => router.push("/dashboard"), 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
      setSavingSettings(false);
    }
  };

  const handleSkip = () => {
    track("onboarding_skipped");
    toast("You can set up your API key anytime in Settings", {
      icon: <Settings className="w-4 h-4" />,
      action: {
        label: "Open Settings",
        onClick: () => router.push("/dashboard/settings"),
      },
      duration: 6000,
    });
    router.push("/dashboard");
  };

  // Loading state while checking soul file
  if (soulFile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600" />
      </div>
    );
  }

  const modelOptions = provider === "openrouter" ? OPENROUTER_MODELS : GOOGLE_MODELS;
  const keyPlaceholder = provider === "openrouter" ? "sk-or-v1-..." : "AIza...";
  const keyLink = provider === "openrouter"
    ? { href: "https://openrouter.ai/keys", label: "openrouter.ai/keys" }
    : { href: "https://aistudio.google.com/app/apikey", label: "aistudio.google.com/app/apikey" };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-mesh relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/[0.05] blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">
            {assistantName || "MNotes"}
          </span>
        </div>
      </div>

      {/* ─── SETUP PHASE ─── */}
      {phase === "setup" && (
        <div className="relative z-10 flex-1 flex items-start justify-center px-4 pt-4 sm:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <div className="card p-6 shadow-xl dark:shadow-none">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Key className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                    Set up your AI
                  </h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    MNotes needs an API key to think for you. Takes 2 minutes.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Provider */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Provider
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        value="openrouter"
                        checked={provider === "openrouter"}
                        onChange={() => {
                          setProvider("openrouter");
                          setModel(OPENROUTER_MODELS[0].value);
                        }}
                        className="rounded-full border-stone-300 dark:border-stone-600 text-blue-600 focus:ring-blue-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          OpenRouter
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 ml-1.5">
                          Multiple models
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        value="google"
                        checked={provider === "google"}
                        onChange={() => {
                          setProvider("google");
                          setModel(GOOGLE_MODELS[0].value);
                        }}
                        className="rounded-full border-stone-300 dark:border-stone-600 text-blue-600 focus:ring-blue-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          Google AI Studio
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 ml-1.5">
                          Direct Gemini access
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Model
                  </label>
                  <Select value={model} onChange={setModel} options={modelOptions} />
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={keyPlaceholder}
                    className="input-field w-full text-base sm:text-sm"
                  />
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    Get your free key at{" "}
                    <a
                      href={keyLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {keyLink.label}
                    </a>
                  </p>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save & Continue"}
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  Skip for now
                </button>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center">
                  You can always configure this later in Settings
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── COMPLETE PHASE ─── */}
      {phase === "complete" && (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
              You&apos;re all set!
            </p>
          </motion.div>
        </div>
      )}

      {/* ─── CHAT PHASE ─── */}
      {phase === "chat" && (
        <>
          <div className="relative z-10 flex-1 flex overflow-hidden">
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="max-w-2xl mx-auto space-y-4 pb-4 lg:max-w-xl">
              {/* Loading skeleton for greeting */}
              {!greetingLoaded && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-white/[0.06]">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 rounded-br-md"
                          : "bg-white dark:bg-stone-900/80 text-stone-800 dark:text-stone-200 rounded-bl-md border border-stone-200 dark:border-white/[0.06]"
                      }`}
                    >
                      <MarkdownMessage content={msg.content} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Sending indicator */}
              {sending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-white/[0.06]">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Soul file preview card */}
              <AnimatePresence>
                {soulFileContent && !confirming && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-[85%]"
                  >
                    <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-200 dark:border-blue-800/30">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                          Your Soul File
                        </span>
                      </div>

                      {/* Content preview */}
                      <div className="px-4 py-3">
                        <pre className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                          {soulFileContent}
                        </pre>
                      </div>

                      {/* Avatar picker */}
                      <div className="px-4 py-3 border-t border-blue-200 dark:border-blue-800/30">
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                          Pick an avatar for your assistant
                        </p>
                        <div className="flex gap-2 mb-3">
                          {AVATARS.map((av) => (
                            <button
                              key={av.id}
                              onClick={() => setSelectedAvatar(av.id)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                selectedAvatar === av.id
                                  ? "bg-blue-600 text-white shadow-md scale-110"
                                  : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-blue-400"
                              }`}
                              title={av.label}
                            >
                              {av.emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Confirm button */}
                      <div className="px-4 py-3 border-t border-blue-200 dark:border-blue-800/30">
                        <button
                          onClick={handleConfirmSoul}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Looks good — let&apos;s go
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success animation */}
              <AnimatePresence>
                {confirming && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center py-8"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                        Setting things up...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Live Preview Panel (desktop only) */}
          <div className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-stone-200/50 dark:border-white/[0.04] bg-white/30 dark:bg-stone-950/30 backdrop-blur-sm overflow-y-auto px-5 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className={`w-4 h-4 text-blue-500 ${messages.length > 1 ? "animate-spin" : ""}`} />
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Building your workspace
              </span>
            </div>

            {/* Tasks Preview */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <ListTodo className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Tasks ({extractedTasks.length})
                </span>
              </div>
              {extractedTasks.length > 0 ? (
                <div className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {extractedTasks.map((task, i) => (
                      <motion.div
                        key={task}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className="flex items-start gap-2 py-1.5 px-2 rounded-lg bg-white/60 dark:bg-white/[0.04] border border-stone-200/60 dark:border-white/[0.06]"
                      >
                        <div className="w-4 h-4 mt-0.5 rounded border border-stone-300 dark:border-stone-600 shrink-0" />
                        <span className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {task}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                  Tell me what you&apos;re working on and I&apos;ll build your task list
                </p>
              )}
            </div>

            {/* Goal Preview */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Goals
                </span>
              </div>
              {extractedGoal ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-1.5 px-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-500/[0.06] border border-emerald-200/60 dark:border-emerald-500/[0.1]"
                >
                  <span className="text-xs text-emerald-800 dark:text-emerald-300">
                    {extractedGoal}
                  </span>
                </motion.div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                  I&apos;ll capture your goals as we talk
                </p>
              )}
            </div>

            {/* Soul File Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Memory
                </span>
              </div>
              {soulFileContent ? (
                <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-blue-50/60 dark:bg-blue-500/[0.06] border border-blue-200/60 dark:border-blue-500/[0.1]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs text-blue-800 dark:text-blue-300">
                    Soul file ready — confirm below
                  </span>
                </div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                  {messages.length > 2 ? "Almost there..." : "Learning about you..."}
                </p>
              )}
            </div>

            {/* Summary stats */}
            {(extractedTasks.length > 0 || extractedGoal || assistantName) && (
              <div className="mt-auto pt-5 border-t border-stone-200/50 dark:border-white/[0.04]">
                <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center">
                  {extractedTasks.length} task{extractedTasks.length !== 1 ? "s" : ""} ready
                  {extractedGoal ? " | 1 goal" : ""}
                  {assistantName ? ` | ${assistantName}` : ""}
                </p>
              </div>
            )}
          </div>
          </div>{/* close flex row */}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="relative z-10 px-4 pb-2"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="relative z-10 border-t border-stone-200/50 dark:border-white/[0.04] bg-white/50 dark:bg-stone-950/50 backdrop-blur-xl">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={greetingLoaded ? "Tell MNotes about yourself..." : "Loading..."}
                  disabled={sending || !greetingLoaded || confirming}
                  rows={1}
                  className="flex-1 resize-none rounded-2xl px-4 py-3 text-base bg-stone-50 dark:bg-white/[0.04] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-white/[0.06] focus:outline-none focus:border-blue-500 transition-colors"
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending || !greetingLoaded || confirming}
                  className="shrink-0 w-11 h-11 rounded-2xl bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 flex items-center justify-center hover:bg-stone-700 dark:hover:bg-white/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const convexAvailable = useConvexAvailable();
  if (!convexAvailable) return <DisconnectedOnboardingPage />;
  return <ConnectedOnboardingPage />;
}
