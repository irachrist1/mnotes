import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup-expired-generated-insights",
  { hourUTC: 3, minuteUTC: 0 },
  internal.aiInsights.cleanupExpiredInternal,
  { limit: 500 }
);

crons.daily(
  "cleanup-expired-prompt-cache",
  { hourUTC: 3, minuteUTC: 10 },
  internal.aiPromptCache.cleanupExpiredInternal,
  { limit: 1000 }
);

crons.weekly(
  "weekly-ai-digest",
  { dayOfWeek: "sunday", hourUTC: 8, minuteUTC: 0 },
  internal.ai.weeklyDigest.runAll,
  {}
);

crons.daily(
  "daily-ai-notifications",
  { hourUTC: 7, minuteUTC: 0 },
  internal.ai.dailyNotifications.runAll,
  {}
);

export default crons;
