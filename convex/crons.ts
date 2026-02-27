import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for due scheduled agent tasks every hour
crons.interval(
  "run-scheduled-agent-tasks",
  { hours: 1 },
  internal.proactive.runDueTasks,
  {}
);

export default crons;
