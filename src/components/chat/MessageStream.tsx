"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Lazy-load react-markdown (heavy)
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

interface MessageStreamProps {
  content: string;
}

/**
 * Renders markdown message content.
 * Uses a cursor blink effect during streaming (when content ends without punctuation).
 */
export function MessageStream({ content }: MessageStreamProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-stone-700 dark:text-stone-200 leading-relaxed [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>h1]:text-base [&>h2]:text-base [&>h3]:text-sm [&_code]:text-blue-600 dark:[&_code]:text-blue-300 [&_code]:bg-stone-100 dark:[&_code]:bg-stone-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-stone-100 dark:[&_pre]:bg-stone-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:no-underline hover:[&_a]:underline">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
