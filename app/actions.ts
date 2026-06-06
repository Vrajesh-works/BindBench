"use server";

import { pollRunningPredictions } from "@/lib/poll";

// Trusted server action used by the results UI to advance the poller in dev,
// where the Vercel cron isn't running. Runs server-side, so no secret is
// exposed to the client. In production the cron route drives polling.
export async function advanceScreenPoll() {
  return pollRunningPredictions();
}
