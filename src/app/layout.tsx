import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import PostHogProvider from "@/components/PostHogProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Jarvis — Your Personal AI Assistant",
  description:
    "Jarvis: a powerful AI agent that connects to your Gmail, Calendar, Outlook, and GitHub to help you stay on top of everything.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const hasConvexUrl = Boolean(convexUrl && !convexUrl.includes("placeholder"));

  const inner = (
    <PostHogProvider>
      <ConvexClientProvider>
        {children}
      </ConvexClientProvider>
    </PostHogProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning className="font-sans antialiased">
        {hasConvexUrl ? (
          <ConvexAuthNextjsServerProvider storageNamespace="mnotes-auth">
            {inner}
          </ConvexAuthNextjsServerProvider>
        ) : (
          inner
        )}
      </body>
    </html>
  );
}
