import { test } from "node:test";
import assert from "node:assert/strict";

import { buildUserSettingsInsert, buildUserSettingsPatch } from "../convex/userSettingsPatch";

test("buildUserSettingsPatch omits undefined optional fields (preserve keys)", () => {
  const patch = buildUserSettingsPatch({
    aiProvider: "openrouter",
    aiModel: "google/gemini-3-flash-preview",
    updatedAt: 123,
    openrouterApiKey: undefined,
    googleApiKey: undefined,
    anthropicApiKey: undefined,
    searchApiKey: undefined,
    searchProvider: undefined,
  });

  assert.deepEqual(patch, {
    aiProvider: "openrouter",
    aiModel: "google/gemini-3-flash-preview",
    updatedAt: 123,
  });
});

test("buildUserSettingsPatch includes optional fields when provided", () => {
  const patch = buildUserSettingsPatch({
    aiProvider: "anthropic",
    aiModel: "claude-sonnet-4-5-20250929",
    updatedAt: 456,
    anthropicApiKey: "sk-ant-xxx",
    searchProvider: "tavily",
  });

  assert.equal(patch.aiProvider, "anthropic");
  assert.equal(patch.aiModel, "claude-sonnet-4-5-20250929");
  assert.equal(patch.updatedAt, 456);
  assert.equal(patch.anthropicApiKey, "sk-ant-xxx");
  assert.equal(patch.searchProvider, "tavily");
  assert.equal("openrouterApiKey" in patch, false);
});

test("buildUserSettingsInsert includes userId + required fields and preserves optional omission", () => {
  const insert = buildUserSettingsInsert({
    userId: "u",
    aiProvider: "google",
    aiModel: "gemini-3-flash-preview",
    updatedAt: 999,
  });

  assert.deepEqual(insert, {
    userId: "u",
    aiProvider: "google",
    aiModel: "gemini-3-flash-preview",
    updatedAt: 999,
  });
});

