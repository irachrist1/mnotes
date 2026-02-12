import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

export const metadata: Metadata = {
  title: "MNotes — Entrepreneurial Dashboard",
  description:
    "Intelligent dashboard for modern tech entrepreneurs to visualize and optimize their multi-stream business operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ConvexClientProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
            {children}
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
