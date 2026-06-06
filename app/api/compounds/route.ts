import { NextRequest, NextResponse } from "next/server";
import { db, sql, schema } from "@/lib/db";

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
  const list = body?.compounds;
  if (!Array.isArray(list) || list.length === 0) {
    return NextResponse.json({ error: "compounds[] is required" }, { status: 400 });
  }

  const values = list
    .filter((c) => c?.name && c?.smiles)
    .map((c) => ({
      name: String(c.name),
      smiles: String(c.smiles),
      source: c.source ? String(c.source) : null,
    }));

  if (values.length === 0) {
    return NextResponse.json(
      { error: "each compound needs name and smiles" },
      { status: 400 },
    );
  }

  const inserted = await db.insert(schema.compounds).values(values).returning({
    id: schema.compounds.id,
    name: schema.compounds.name,
    smiles: schema.compounds.smiles,
  });

  return NextResponse.json({ inserted: inserted.length, compounds: inserted }, { status: 201 });
}
