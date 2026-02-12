import React from "react";
import { render, RenderOptions } from "@testing-library/react";

/**
 * Mock provider wrapper for testing components that need Convex context.
 * Components that use useQuery/useMutation will need individual mocking
 * via vi.mock("convex/react").
 */
function TestProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };
