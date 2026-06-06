import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { startPrediction } from "@/lib/boltz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/screens/start  (claude.md §5.2 — fan-out)
// Body: { projectId, compoundIds: string[] }
// Creates a screen, inserts N predictions (pending), starts a Boltz job per
// compound, flips each row to "running", and records a usage_event per job.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const projectId: string | undefined = body?.projectId;
  const compoundIds: string[] = Array.isArray(body?.compoundIds) ? body.compoundIds : [];

  if (!projectId || compoundIds.length === 0) {
    return NextResponse.json(
      { error: "projectId and compoundIds[] are required" },
      { status: 400 },
    );
  }

  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
  });
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  const target = await db.query.targets.findFirst({
    where: eq(schema.targets.id, project.targetId),
  });
  if (!target) {
    return NextResponse.json({ error: "target not found" }, { status: 404 });
  }

  const compounds = await db.query.compounds.findMany({
    where: inArray(schema.compounds.id, compoundIds),
  });
  if (compounds.length === 0) {
    return NextResponse.json({ error: "no matching compounds" }, { status: 404 });
  }

  // Create the screen.
  const [screen] = await db
    .insert(schema.screens)
    .values({
      projectId: project.id,
      targetId: target.id,
      status: "running",
      totalCount: compounds.length,
      completedCount: 0,
    })
    .returning();

  // Fan out: one prediction row + one Boltz job per compound.
  let started = 0;
  for (const compound of compounds) {
    const [pred] = await db
      .insert(schema.predictions)
      .values({
        screenId: screen.id,
        compoundId: compound.id,
        targetId: target.id,
        status: "pending",
      })
      .returning({ id: schema.predictions.id });

    try {
      const { jobId } = await startPrediction({
        proteinSequence: target.sequence,
        ligandSmiles: compound.smiles,
        seed: pred.id,
      });
      await db
        .update(schema.predictions)
        .set({ boltzJobId: jobId, status: "running", startedAt: new Date() })
        .where(eq(schema.predictions.id, pred.id));
      await db.insert(schema.usageEvents).values({
        predictionId: pred.id,
        screenId: screen.id,
        eventType: "prediction_started",
        credits: 1,
      });
      started++;
    } catch (e: any) {
      await db
        .update(schema.predictions)
        .set({ status: "failed", error: e?.message ?? "start failed", completedAt: new Date() })
        .where(eq(schema.predictions.id, pred.id));
    }
  }

  return NextResponse.json({ screenId: screen.id, total: compounds.length, started }, { status: 201 });
}
