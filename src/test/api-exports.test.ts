import { describe, it, expect } from "vitest";

/**
 * Critical test: Validate that every frontend api.* reference
 * matches an actual Convex export. TypeScript won't catch
 * mismatches because _generated/api.d.ts uses anyApi.
 *
 * This test imports the actual Convex modules and verifies
 * the exports exist as named exports.
 */

describe("API export name validation", () => {
  describe("convex/ideas.ts exports", () => {
    it("exports list, byStage, create, update, remove", async () => {
      const mod = await import("@convex/ideas");
      expect(mod.list).toBeDefined();
      expect(mod.byStage).toBeDefined();
      expect(mod.create).toBeDefined();
      expect(mod.update).toBeDefined();
      expect(mod.remove).toBeDefined();
    });
  });

  describe("convex/incomeStreams.ts exports", () => {
    it("exports list, byStatus, create, update, remove", async () => {
      const mod = await import("@convex/incomeStreams");
      expect(mod.list).toBeDefined();
      expect(mod.byStatus).toBeDefined();
      expect(mod.create).toBeDefined();
      expect(mod.update).toBeDefined();
      expect(mod.remove).toBeDefined();
    });
  });

  describe("convex/mentorshipSessions.ts exports", () => {
    it("exports list, byType, create, update, remove, toggleActionItem", async () => {
      const mod = await import("@convex/mentorshipSessions");
      expect(mod.list).toBeDefined();
      expect(mod.byType).toBeDefined();
      expect(mod.create).toBeDefined();
      expect(mod.update).toBeDefined();
      expect(mod.remove).toBeDefined();
      expect(mod.toggleActionItem).toBeDefined();
    });
  });

  describe("convex/userSettings.ts exports", () => {
    it("exports get and upsert", async () => {
      const mod = await import("@convex/userSettings");
      expect(mod.get).toBeDefined();
      expect(mod.upsert).toBeDefined();
    });
  });

  describe("convex/agentFiles.ts exports", () => {
    it("exports list, listByTask, get, create, update, remove", async () => {
      const mod = await import("@convex/agentFiles");
      expect(mod.list).toBeDefined();
      expect(mod.listByTask).toBeDefined();
      expect(mod.get).toBeDefined();
      expect(mod.create).toBeDefined();
      expect(mod.update).toBeDefined();
      expect(mod.remove).toBeDefined();
    });
  });

  describe("convex/aiInsights.ts exports", () => {
    it("exports listGenerated, list, create, saveGenerated, updateStatus, remove", async () => {
      const mod = await import("@convex/aiInsights");
      expect(mod.listGenerated).toBeDefined();
      expect(mod.list).toBeDefined();
      expect(mod.create).toBeDefined();
      expect(mod.saveGenerated).toBeDefined();
      expect(mod.updateStatus).toBeDefined();
      expect(mod.remove).toBeDefined();
    });
  });

  describe("convex/savedInsights.ts exports", () => {
    it("exports list, search, getById, archive, togglePin, remove, touchUsage", async () => {
      const mod = await import("@convex/savedInsights");
      expect(mod.list).toBeDefined();
      expect(mod.search).toBeDefined();
      expect(mod.getById).toBeDefined();
      expect(mod.archive).toBeDefined();
      expect(mod.togglePin).toBeDefined();
      expect(mod.remove).toBeDefined();
      expect(mod.touchUsage).toBeDefined();
    });
  });

  describe("convex/commandPalette.ts exports", () => {
    it("exports search", async () => {
      const mod = await import("@convex/commandPalette");
      expect(mod.search).toBeDefined();
    });
  });

  describe("convex/ai/analyze.ts exports", () => {
    it("exports analyze", async () => {
      const mod = await import("@convex/ai/analyze");
      expect(mod.analyze).toBeDefined();
    });
  });

  describe("convex/ai/embed.ts exports", () => {
    it("exports embedText", async () => {
      const mod = await import("@convex/ai/embed");
      expect(mod.embedText).toBeDefined();
    });
  });

  describe("convex/ai/contextBuilder.ts exports", () => {
    it("exports buildContextPacket", async () => {
      const mod = await import("@convex/ai/contextBuilder");
      expect(mod.buildContextPacket).toBeDefined();
    });
  });

  describe("convex/ai/generate.ts exports", () => {
    it("exports generate", async () => {
      const mod = await import("@convex/ai/generate");
      expect(mod.generate).toBeDefined();
    });
  });

  describe("convex/users.ts exports", () => {
    it("exports me", async () => {
      const mod = await import("@convex/users");
      expect(mod.me).toBeDefined();
    });
  });
});
