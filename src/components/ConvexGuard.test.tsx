import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { ConvexGuard } from "./ConvexGuard";

// Mock the ConvexClientProvider hooks
const mockUseConvexAvailable = vi.fn();
vi.mock("@/components/ConvexClientProvider", () => ({
  useConvexAvailable: () => mockUseConvexAvailable(),
}));

describe("ConvexGuard", () => {
  it("renders children when Convex is available", () => {
    mockUseConvexAvailable.mockReturnValue(true);
    render(
      <ConvexGuard>
        <div data-testid="child">Dashboard Content</div>
      </ConvexGuard>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  it("shows error message when Convex is not available", () => {
    mockUseConvexAvailable.mockReturnValue(false);
    render(
      <ConvexGuard>
        <div data-testid="child">Dashboard Content</div>
      </ConvexGuard>
    );
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByText("Convex not connected")).toBeInTheDocument();
    expect(screen.getByText(/NEXT_PUBLIC_CONVEX_URL/)).toBeInTheDocument();
  });
});
