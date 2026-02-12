"use client";

import { MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ChatButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-4 right-4 sm:right-6 z-50 w-12 h-12 rounded-full bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={open ? "Close chat" : "Open chat"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MessageSquare className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
