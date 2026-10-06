import { NextRequest, NextResponse } from "next/server";
import { db, sql, schema } from "@/lib/db";
import { createCompoundsSchema, validationError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/compounds — list compounds (newest first).
export async function GET() {
  const rows = await sql`
    SELECT id, name, smiles, source, created_at
    FROM compounds
    ORDER BY created_at DESC
    LIMIT 1000
  `;
  return NextResponse.json({ compounds: rows });
}

// POST /api/compounds — bulk insert compounds.
// Body: { compounds: [{ name, smiles, source? }] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createCompoundsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      validationError("invalid request body", parsed.error.issues),
      { status: 400 },
    );
  }

  const values = parsed.data.compounds.map((cmp) => ({
    name: cmp.name,
    smiles: cmp.smiles,
    source: cmp.source ?? null,
  }));

  const inserted = await db.insert(schema.compounds).values(values).returning({
    id: schema.compounds.id,
    name: schema.compounds.name,
    smiles: schema.compounds.smiles,
  });

  return NextResponse.json({ inserted: inserted.length, compounds: inserted }, { status: 201 });
}
