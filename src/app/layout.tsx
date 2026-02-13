import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MNotes — Personal Business Intelligence",
  description:
    "Track your income streams, ideas, and mentorship sessions. Let AI connect the dots and surface what matters most.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const hasConvexUrl = Boolean(convexUrl && !convexUrl.includes("placeholder"));

  const doc = (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ConvexClientProvider>
          <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
            {children}
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );

  // Avoid hard-crashing production when Convex env vars are missing.
  if (!hasConvexUrl) return doc;

  return (
    <ConvexAuthNextjsServerProvider storageNamespace="mnotes-auth">
      {doc}
    </ConvexAuthNextjsServerProvider>
  );
}
