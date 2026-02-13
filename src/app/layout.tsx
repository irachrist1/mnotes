import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";

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

  const inner = (
    <ConvexClientProvider>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        {children}
      </div>
    </ConvexClientProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
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
