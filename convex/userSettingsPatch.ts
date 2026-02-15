export type SearchProvider = "jina" | "tavily";
export type AiProvider = "openrouter" | "google" | "anthropic";

export type UserSettingsInsertInput = {
  userId: string;
  aiProvider: AiProvider;
  aiModel: string;
  openrouterApiKey?: string;
  googleApiKey?: string;
  anthropicApiKey?: string;
  searchProvider?: SearchProvider;
  searchApiKey?: string;
  updatedAt: number;
};

export type UserSettingsPatchInput = Omit<UserSettingsInsertInput, "userId">;

export function buildUserSettingsInsert(input: UserSettingsInsertInput): UserSettingsInsertInput {
  const data: UserSettingsInsertInput = {
    userId: input.userId,
    aiProvider: input.aiProvider,
    aiModel: input.aiModel,
    updatedAt: input.updatedAt,
  };

  if (input.openrouterApiKey !== undefined) data.openrouterApiKey = input.openrouterApiKey;
  if (input.googleApiKey !== undefined) data.googleApiKey = input.googleApiKey;
  if (input.anthropicApiKey !== undefined) data.anthropicApiKey = input.anthropicApiKey;
  if (input.searchProvider !== undefined) data.searchProvider = input.searchProvider;
  if (input.searchApiKey !== undefined) data.searchApiKey = input.searchApiKey;

  return data;
}

export type UserSettingsPatch = {
  aiProvider: AiProvider;
  aiModel: string;
  updatedAt: number;
  openrouterApiKey?: string;
  googleApiKey?: string;
  anthropicApiKey?: string;
  searchProvider?: SearchProvider;
  searchApiKey?: string;
};

export function buildUserSettingsPatch(input: UserSettingsPatchInput): UserSettingsPatch {
  const patch: UserSettingsPatch = {
    aiProvider: input.aiProvider,
    aiModel: input.aiModel,
    updatedAt: input.updatedAt,
  };

  // Omitting optional fields preserves whatever is stored server-side.
  if (input.openrouterApiKey !== undefined) patch.openrouterApiKey = input.openrouterApiKey;
  if (input.googleApiKey !== undefined) patch.googleApiKey = input.googleApiKey;
  if (input.anthropicApiKey !== undefined) patch.anthropicApiKey = input.anthropicApiKey;
  if (input.searchProvider !== undefined) patch.searchProvider = input.searchProvider;
  if (input.searchApiKey !== undefined) patch.searchApiKey = input.searchApiKey;

  return patch;
}
