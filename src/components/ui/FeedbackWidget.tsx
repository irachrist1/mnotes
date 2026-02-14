"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { Bug, Lightbulb, MessageCircle, MessageSquarePlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

const TYPES = [
  { value: "bug" as const, label: "Bug", icon: Bug },
  { value: "feature" as const, label: "Feature", icon: Lightbulb },
  { value: "general" as const, label: "General", icon: MessageCircle },
];

export function FeedbackWidget() {
  const [type, setType] = useState<"bug" | "feature" | "general">("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitFeedback = useMutation(api.feedback.submit);
  const pathname = usePathname();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter your feedback");
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ type, message, page: pathname ?? undefined });
      track("feedback_submitted", { type, page: pathname ?? undefined });
      toast.success("Thanks for your feedback!");
      setMessage("");
      setType("general");
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
          <MessageSquarePlus className="w-4 h-4 text-stone-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Send Feedback
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Report a bug, request a feature, or share your thoughts
          </p>
        </div>
      </div>

      {/* Type selector */}
      <div className="flex gap-1.5 mb-3">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              type === t.value
                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/20"
                : "bg-stone-50 dark:bg-white/[0.04] text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-lg px-3 py-2.5 text-base sm:text-sm bg-stone-50 dark:bg-white/[0.04] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-200 dark:border-white/[0.06] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors mb-3"
      />

      <button
        onClick={() => void handleSubmit()}
        disabled={!message.trim() || submitting}
        className="w-full py-2 rounded-lg text-sm font-medium bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white/70 transition-colors disabled:opacity-40"
      >
        {submitting ? "Sending..." : "Send Feedback"}
      </button>
    </div>
  );
}
