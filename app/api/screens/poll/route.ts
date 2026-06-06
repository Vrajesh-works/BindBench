import { NextRequest, NextResponse } from "next/server";
import { pollRunningPredictions } from "@/lib/poll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

// GET /api/screens/poll  (claude.md §5.3 — cron poller)
// Vercel Cron sends GET with `Authorization: Bearer <CRON_SECRET>`.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await pollRunningPredictions();
  return NextResponse.json(result);
}
