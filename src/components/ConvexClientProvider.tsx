"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { createContext, ReactNode, useContext, useMemo } from "react";

const ConvexAvailableContext = createContext(false);
const ClerkAvailableContext = createContext(false);

export function useConvexAvailable() {
  return useContext(ConvexAvailableContext);
}

export function useClerkAvailable() {
  return useContext(ClerkAvailableContext);
}

function getClerkKey(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key || key === "" || key.includes("placeholder")) return null;
  return key;
}

function getConvexUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || url.includes("placeholder")) return null;
  return url;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convexUrl = getConvexUrl();
  const clerkKey = getClerkKey();

  const convex = useMemo(() => {
    if (!convexUrl) return null;
    try {
      return new ConvexReactClient(convexUrl);
    } catch {
      return null;
    }
  }, [convexUrl]);

  // No Convex: render without any providers
  if (!convex) {
    return (
      <ClerkAvailableContext.Provider value={false}>
        <ConvexAvailableContext.Provider value={false}>
          {children}
        </ConvexAvailableContext.Provider>
      </ClerkAvailableContext.Provider>
    );
  }

  // Convex available but no Clerk: render with just ConvexProvider (dev mode)
  if (!clerkKey) {
    return (
      <ClerkAvailableContext.Provider value={false}>
        <ConvexAvailableContext.Provider value={true}>
          <ConvexProvider client={convex}>{children}</ConvexProvider>
        </ConvexAvailableContext.Provider>
      </ClerkAvailableContext.Provider>
    );
  }

  // Both Convex and Clerk available: full auth setup
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ClerkAvailableContext.Provider value={true}>
        <ConvexAvailableContext.Provider value={true}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
          </ConvexProviderWithClerk>
        </ConvexAvailableContext.Provider>
      </ClerkAvailableContext.Provider>
    </ClerkProvider>
  );
}
