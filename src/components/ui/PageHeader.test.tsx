import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { PageHeader } from "./PageHeader";

// Mock framer-motion
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
}));

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Dashboard"
    );
  });

  it("renders description when provided", () => {
    render(
      <PageHeader title="Ideas" description="Track your business ideas" />
    );
    expect(screen.getByText("Track your business ideas")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<PageHeader title="Ideas" />);
    const desc = container.querySelector(".text-sm.text-gray-500");
    expect(desc).not.toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <PageHeader
        title="Ideas"
        action={<button>Add Idea</button>}
      />
    );
    expect(screen.getByText("Add Idea")).toBeInTheDocument();
  });

  it("does not render action container when not provided", () => {
    const { container } = render(<PageHeader title="Ideas" />);
    const actionContainer = container.querySelector(".flex-shrink-0");
    expect(actionContainer).not.toBeInTheDocument();
  });
});
