"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Check } from "lucide-react";
import { MarkdownMessage } from "@/components/ui/MarkdownMessage";

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

export default function OnboardingPage() {
  const router = useRouter();
  const soulFile = useQuery(api.soulFile.get, {});
  const sendOnboard = useAction(api.ai.onboardSend.send);
  const generateGreeting = useAction(api.ai.onboardSend.generateGreeting);
  const initSoul = useMutation(api.soulFile.initializeFromMarkdown);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [assistantName, setAssistantName] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [soulFileContent, setSoulFileContent] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingFetched = useRef(false);

  // Redirect if soul file already exists
  useEffect(() => {
    if (soulFile !== undefined && soulFile !== null) {
      router.replace("/dashboard");
    }
  }, [soulFile, router]);

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
    try {
      await initSoul({
        content: soulFileContent,
        assistantName: assistantName ?? undefined,
      });
      // Brief pause for the confirmation animation, then redirect
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
      setConfirming(false);
    }
  };

  // Loading state while checking soul file
  if (soulFile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600" />
      </div>
    );
  }

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

      {/* Chat area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4">
        <div className="max-w-2xl mx-auto space-y-4 pb-4">
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
              className="flex-1 resize-none rounded-2xl px-4 py-3 text-[15px] bg-stone-50 dark:bg-white/[0.04] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-white/[0.06] focus:outline-none focus:border-blue-500 transition-colors"
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
    </div>
  );
}
