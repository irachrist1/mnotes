import { describe, expect, it } from "vitest";
import { getSaveButtonLabel } from "./page";

describe("AI insights save button state", () => {
  it("shows saving label while mutation is pending", () => {
    expect(getSaveButtonLabel({
      isSaved: false,
      isSaving: true,
      isNearDuplicate: false,
    })).toBe("Saving...");
  });

  it("shows saved label for already persisted insight", () => {
    expect(getSaveButtonLabel({
      isSaved: true,
      isSaving: false,
      isNearDuplicate: false,
    })).toBe("Saved");
  });

  it("shows near-duplicate warning label before user confirmation", () => {
    expect(getSaveButtonLabel({
      isSaved: false,
      isSaving: false,
      isNearDuplicate: true,
    })).toBe("Similar exists");
  });
});
