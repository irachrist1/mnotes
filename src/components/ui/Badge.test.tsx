import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>active</Badge>);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { container } = render(<Badge>test</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("bg-stone-100");
    expect(badge).toHaveClass("text-stone-700");
  });

  it("renders all variants", () => {
    const variants = [
      "default",
      "success",
      "warning",
      "danger",
      "info",
      "muted",
    ] as const;

    variants.forEach((variant) => {
      const { unmount } = render(
        <Badge variant={variant}>{variant}</Badge>
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });

  it("renders success variant with green classes", () => {
    const { container } = render(<Badge variant="success">ok</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("bg-emerald-50");
    expect(badge).toHaveClass("text-emerald-700");
  });

  it("renders danger variant with red classes", () => {
    const { container } = render(<Badge variant="danger">error</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("bg-red-50");
    expect(badge).toHaveClass("text-red-700");
  });

  it("renders sm size by default", () => {
    const { container } = render(<Badge>small</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("text-xs");
  });

  it("renders md size", () => {
    const { container } = render(<Badge size="md">medium</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("text-sm");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Badge className="custom-class">custom</Badge>
    );
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("custom-class");
  });

  it("always has base styling classes", () => {
    const { container } = render(<Badge>base</Badge>);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("inline-flex");
    expect(badge).toHaveClass("items-center");
    expect(badge).toHaveClass("rounded-md");
    expect(badge).toHaveClass("font-medium");
  });
});
