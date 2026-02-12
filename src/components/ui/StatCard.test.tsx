import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { StatCard } from "./StatCard";

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
  useMotionValue: () => ({ on: () => () => {} }),
  useTransform: () => ({ on: () => () => {} }),
  animate: () => ({ stop: () => {} }),
}));

describe("StatCard", () => {
  it("renders label", () => {
    render(<StatCard label="Monthly Revenue" value="$5,000" />);
    expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
  });

  it("renders string value with prefix", () => {
    render(<StatCard label="Test" value="$5,000" />);
    // Value gets split: "$" prefix + "5,000" animated number
    expect(screen.getByText("$", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
  });

  it("renders numeric value", () => {
    render(<StatCard label="Count" value={42} />);
    // AnimatedNumber renders initial value
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders detail text when provided", () => {
    render(<StatCard label="Revenue" value="$1,000" detail="3 active streams" />);
    expect(screen.getByText("3 active streams")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const MockIcon = (props: { className?: string; strokeWidth?: number }) => (
      <svg data-testid="stat-icon" {...props} />
    );
    render(<StatCard label="Revenue" value="$1,000" icon={MockIcon as never} />);
    expect(screen.getByTestId("stat-icon")).toBeInTheDocument();
  });

  it("renders trend when provided", () => {
    render(
      <StatCard
        label="Revenue"
        value="$1,000"
        trend={{ value: "+15%", positive: true }}
      />
    );
    expect(screen.getByText("+15%")).toBeInTheDocument();
  });

  it("applies positive trend styling", () => {
    const { container } = render(
      <StatCard
        label="Revenue"
        value="$1,000"
        trend={{ value: "+15%", positive: true }}
      />
    );
    const trendEl = container.querySelector(".text-emerald-600");
    expect(trendEl).toBeInTheDocument();
  });

  it("applies negative trend styling", () => {
    const { container } = render(
      <StatCard
        label="Revenue"
        value="$1,000"
        trend={{ value: "-5%", positive: false }}
      />
    );
    const trendEl = container.querySelector(".text-red-500");
    expect(trendEl).toBeInTheDocument();
  });

  it("does not render detail when not provided", () => {
    const { container } = render(<StatCard label="Test" value={0} />);
    const detail = container.querySelector(".text-xs.text-gray-500.mt-1\\.5");
    expect(detail).not.toBeInTheDocument();
  });
});
