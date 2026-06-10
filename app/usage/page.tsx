import { Activity, Database, Gauge } from "lucide-react";
import { sql } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const MONTHLY_FREE = 200; // Boltz free tier: 200 predictions/month

const STATUS_COLORS: Record<string, string> = {
  succeeded: "bg-primary",
  running: "bg-secondary-foreground/40",
  pending: "bg-muted-foreground/40",
  failed: "bg-destructive",
};

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
  const remaining = Math.max(0, MONTHLY_FREE - thisMonth);
  const totalByStatus = byStatus.reduce((acc, s) => acc + s.count, 0);

  return (
    <main className="container py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
          Boltz-2 prediction consumption against the free tier of {MONTHLY_FREE} predictions per
          month.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Gauge className="h-4 w-4 text-primary" /> This month
            </CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">{remaining} remaining</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tabular-nums">{thisMonth}</span>
              <span className="text-lg text-muted-foreground"> / {MONTHLY_FREE}</span>
              <span className="ml-auto text-sm font-medium tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct >= 90 && (
              <p className="text-xs text-destructive">
                You&apos;re approaching the monthly free-tier limit.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" /> All-time predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums">{allTime}</div>
            <p className="mt-1 text-xs text-muted-foreground">Across every project and screen</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Database className="h-4 w-4 text-primary" /> Predictions by status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No predictions yet.</p>
          ) : (
            <>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {byStatus.map((s) => (
                  <div
                    key={s.status}
                    className={STATUS_COLORS[s.status] ?? "bg-muted-foreground/40"}
                    style={{ width: `${(s.count / totalByStatus) * 100}%` }}
                    title={`${s.status}: ${s.count}`}
                  />
                ))}
              </div>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {byStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          STATUS_COLORS[s.status] ?? "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="capitalize text-muted-foreground">{s.status}</span>
                    </span>
                    <span className="font-medium tabular-nums">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
