// Core polling logic shared by the cron route (/api/screens/poll) and the
// dev-time server action. Polls running predictions, writes Boltz results, and
// advances screen progress. Trusted callers only (auth is enforced upstream).
import { eq } from "drizzle-orm";
import { db, sql, schema } from "@/lib/db";
import { getPrediction } from "@/lib/boltz";

const BATCH = 100;

export async function pollRunningPredictions() {
  const running = await db.query.predictions.findMany({
    where: eq(schema.predictions.status, "running"),
    limit: BATCH,
  });

  let updated = 0;
  const touchedScreens = new Set<string>();

  for (const pred of running) {
    if (!pred.boltzJobId) continue;
    try {
      const r = await getPrediction(pred.boltzJobId);
      if (r.status === "succeeded" || r.status === "failed") {
        await db
          .update(schema.predictions)
          .set({
            status: r.status,
            affinityPredValue: r.affinityPredValue,
            affinityProbabilityBinary: r.affinityProbabilityBinary,
            confidenceScore: r.confidenceScore,
            structureUrl: r.structureUrl,
            error: r.error ?? null,
            completedAt: new Date(),
          })
          .where(eq(schema.predictions.id, pred.id));
        updated++;
        touchedScreens.add(pred.screenId);
      }
    } catch (e: any) {
      console.error(`poll error for ${pred.boltzJobId}:`, e?.message);
    }
  }

  if (touchedScreens.size > 0) {
    const ids = [...touchedScreens];
    await sql`
      UPDATE screens s SET
        completed_count = sub.done,
        status = CASE WHEN sub.done >= s.total_count THEN 'completed' ELSE s.status END
      FROM (
        SELECT screen_id,
               COUNT(*) FILTER (WHERE status IN ('succeeded','failed')) AS done
        FROM predictions
        WHERE screen_id = ANY(${ids})
        GROUP BY screen_id
      ) sub
      WHERE s.id = sub.screen_id
    `;
  }

  return { polled: running.length, updated, screensAdvanced: touchedScreens.size };
}
