import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { EmptyState } from "./EmptyState";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="No items" description="Add some items to get started" />
    );
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Add some items to get started")).toBeInTheDocument();
  });

  it("renders with a component icon", () => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid="mock-icon" className={className} />
    );
    render(
      <EmptyState
        icon={MockIcon}
        title="Empty"
        description="Nothing here"
      />
    );
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("renders with a ReactNode icon", () => {
    render(
      <EmptyState
        icon={<span data-testid="node-icon">icon</span>}
        title="Empty"
        description="Nothing here"
      />
    );
    expect(screen.getByTestId("node-icon")).toBeInTheDocument();
  });

  it("renders without icon", () => {
    render(
      <EmptyState title="No data" description="Description text" />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        title="Empty"
        description="Nothing"
        action={<button>Add Item</button>}
      />
    );
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("does not render action when not provided", () => {
    render(
      <EmptyState title="Empty" description="Nothing" />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
