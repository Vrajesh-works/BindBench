import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resultsQuerySchema, validationError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/results?projectId=...   (claude.md §5.4 — ranked query)
// Returns predictions joined to compounds for a project, ranked by predicted
// affinity (strongest first), with per-row status so the UI can show "running".
export async function GET(req: NextRequest) {
  const parsed = resultsQuerySchema.safeParse({
    projectId: req.nextUrl.searchParams.get("projectId") ?? undefined,
    screenId: req.nextUrl.searchParams.get("screenId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      validationError("invalid query parameters", parsed.error.issues),
      { status: 400 },
    );
  }
  const { projectId, screenId } = parsed.data;

  const rows = await sql`
    SELECT
      pr.id,
      pr.status,
      pr.affinity_pred_value,
      pr.affinity_probability_binary,
      pr.confidence_score,
      pr.structure_url,
      pr.error,
      pr.created_at,
      pr.completed_at,
      c.id   AS compound_id,
      c.name AS compound_name,
      c.smiles,
      s.id   AS screen_id,
      s.project_id
    FROM predictions pr
    JOIN compounds c ON c.id = pr.compound_id
    JOIN screens s   ON s.id = pr.screen_id
    WHERE ${
      screenId
        ? sql`s.id = ${screenId}`
        : sql`s.project_id = ${projectId}`
    }
    ORDER BY
      pr.affinity_pred_value DESC NULLS LAST,
      pr.affinity_probability_binary DESC NULLS LAST
  `;

  return NextResponse.json({ results: rows });
}
