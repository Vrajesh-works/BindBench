// Core polling logic shared by the cron route (/api/screens/poll) and the
// dev-time server action. Polls running predictions, writes Boltz results, and
// advances screen progress. Trusted callers only (auth is enforced upstream).
import { eq } from "drizzle-orm";
import { db, sql, schema } from "@/lib/db";
import { getPrediction } from "@/lib/boltz";
import { pendoTrackServer } from "@/lib/pendo-server";

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

        // Track each prediction completion (status transition from "running" to terminal)
        pendoTrackServer("prediction_completed", {
          predictionId: pred.id,
          screenId: pred.screenId,
          compoundId: pred.compoundId,
          targetId: pred.targetId ?? "",
          status: r.status,
          affinityPredValue: r.affinityPredValue ?? null,
          affinityProbabilityBinary: r.affinityProbabilityBinary ?? null,
          confidenceScore: r.confidenceScore ?? null,
          hasStructureUrl: Boolean(r.structureUrl),
          errorMessage: r.error?.substring(0, 100) ?? null,
        });

        updated++;
        touchedScreens.add(pred.screenId);
      }
    } catch (e: any) {
      console.error(`poll error for ${pred.boltzJobId}:`, e?.message);
    }
  }

  if (touchedScreens.size > 0) {
    const ids = [...touchedScreens];
    // Track which screens were not yet completed before the update
    const previouslyCompleted = await sql`
      SELECT id FROM screens WHERE id = ANY(${ids}) AND status = 'completed'
    `;
    const previouslyCompletedIds = new Set(previouslyCompleted.map((r: any) => r.id));

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

    // Detect screens that just transitioned to 'completed'
    const nowCompleted = await sql`
      SELECT s.id, s.project_id, s.total_count, s.created_at,
             COUNT(*) FILTER (WHERE p.status = 'succeeded') AS succeeded_count,
             COUNT(*) FILTER (WHERE p.status = 'failed') AS failed_count
      FROM screens s
      JOIN predictions p ON p.screen_id = s.id
      WHERE s.id = ANY(${ids}) AND s.status = 'completed'
      GROUP BY s.id
    `;
    for (const screen of nowCompleted) {
      if (previouslyCompletedIds.has(screen.id)) continue;
      const durationSeconds = Math.round(
        (Date.now() - new Date(screen.created_at).getTime()) / 1000,
      );
      pendoTrackServer("screening_completed", {
        screenId: screen.id,
        projectId: screen.project_id,
        totalPredictions: Number(screen.total_count),
        succeededCount: Number(screen.succeeded_count),
        failedCount: Number(screen.failed_count),
        durationSeconds,
      });
    }
  }

  return { polled: running.length, updated, screensAdvanced: touchedScreens.size };
}
