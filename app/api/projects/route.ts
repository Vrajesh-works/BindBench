import { NextRequest, NextResponse } from "next/server";
import { db, sql, schema } from "@/lib/db";
import { createProjectSchema, validationError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/projects — list projects with their target + screen/prediction summary.
export async function GET() {
  const rows = await sql`
    SELECT
      p.id,
      p.name,
      p.description,
      p.status,
      p.created_at,
      t.id   AS target_id,
      t.name AS target_name,
      COUNT(DISTINCT s.id)                                  AS screen_count,
      COUNT(pr.id)                                          AS prediction_count,
      COUNT(pr.id) FILTER (WHERE pr.status = 'succeeded')   AS succeeded_count
    FROM projects p
    JOIN targets t          ON t.id = p.target_id
    LEFT JOIN screens s      ON s.project_id = p.id
    LEFT JOIN predictions pr ON pr.screen_id = s.id
    GROUP BY p.id, t.id
    ORDER BY p.created_at DESC
  `;
  return NextResponse.json({ projects: rows });
}

// POST /api/projects — create a target (or reuse targetId) + a project.
// Body: { name, description?, targetId? , target?: { name, uniprotId?, sequence } }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      validationError("invalid request body", parsed.error.issues),
      { status: 400 },
    );
  }
  const { name, description, target: inputTarget } = parsed.data;

  let targetId: string | undefined = parsed.data.targetId;

  if (!targetId) {
    const [inserted] = await db
      .insert(schema.targets)
      .values({
        name: inputTarget!.name,
        uniprotId: inputTarget!.uniprotId ?? null,
        sequence: inputTarget!.sequence,
      })
      .returning({ id: schema.targets.id });
    targetId = inserted.id;
  }

  const [project] = await db
    .insert(schema.projects)
    .values({
      name,
      description: description ?? null,
      targetId: targetId!,
    })
    .returning();

  return NextResponse.json({ project }, { status: 201 });
}
