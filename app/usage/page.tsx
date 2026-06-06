import { sql } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const MONTHLY_FREE = 200; // Boltz free tier: 200 predictions/month

export default async function UsagePage() {
  const [{ count: thisMonth }] = (await sql`
    SELECT COUNT(*)::int AS count
    FROM usage_events
    WHERE event_type = 'prediction_started'
      AND created_at >= date_trunc('month', now())
  `) as unknown as Array<{ count: number }>;

  const [{ count: allTime }] = (await sql`
    SELECT COUNT(*)::int AS count FROM usage_events WHERE event_type = 'prediction_started'
  `) as unknown as Array<{ count: number }>;

  const byStatus = (await sql`
    SELECT status, COUNT(*)::int AS count FROM predictions GROUP BY status
  `) as unknown as Array<{ status: string; count: number }>;

  const pct = Math.min(100, Math.round((thisMonth / MONTHLY_FREE) * 100));

  return (
    <main className="container py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
      <p className="text-sm text-muted-foreground">
        Boltz prediction consumption against the free tier.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">This month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {thisMonth}
              <span className="text-base text-muted-foreground"> / {MONTHLY_FREE}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">All-time predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{allTime}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">By status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {byStatus.length === 0 && <span className="text-muted-foreground">No predictions yet.</span>}
            {byStatus.map((s) => (
              <div key={s.status} className="flex justify-between">
                <span className="capitalize text-muted-foreground">{s.status}</span>
                <span className="tabular-nums">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
