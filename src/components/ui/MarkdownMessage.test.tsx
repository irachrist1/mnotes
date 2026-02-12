import { describe, expect, it } from "vitest";
import { render } from "@/test/utils";
import { MarkdownMessage } from "./MarkdownMessage";

describe("MarkdownMessage", () => {
  it("renders bold and italic markdown", () => {
    const { container } = render(
      <MarkdownMessage content="This is **bold** and *italic*." />
    );

    const bold = container.querySelector("strong");
    const italic = container.querySelector("em");

    expect(bold).toBeInTheDocument();
    expect(bold).toHaveTextContent("bold");
    expect(italic).toBeInTheDocument();
    expect(italic).toHaveTextContent("italic");
  });
});
