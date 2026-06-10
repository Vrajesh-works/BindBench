"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Boxes, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { StructureDrawer } from "@/components/structure-drawer";
import { advanceScreenPoll } from "@/app/actions";

export type ResultRow = {
  id: string;
  status: "pending" | "running" | "succeeded" | "failed";
  affinity_pred_value: number | null;
  affinity_probability_binary: number | null;
  confidence_score: number | null;
  structure_url: string | null;
  compound_name: string;
  smiles: string;
};

function statusBadge(status: ResultRow["status"]) {
  switch (status) {
    case "succeeded":
      return (
        <Badge
          variant="muted"
          className="border-primary/20 bg-primary/10 text-primary"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Succeeded
        </Badge>
      );
    case "running":
      return (
        <Badge variant="secondary">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Running
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="muted">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" /> Failed
        </Badge>
      );
  }
}

const fmt = (v: number | null, d = 3) => (v == null ? "—" : v.toFixed(d));

export function ResultsTable({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/results?projectId=${projectId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load results");
      const data = (await res.json()) as { results: ResultRow[] };
      setRows(data.results ?? []);
      setError(null);
      setLoading(false);
      return data.results ?? [];
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load results");
      setLoading(false);
      return [];
    }
  }, [projectId]);

  useEffect(() => {
    let active = true;
    async function tick() {
      const current = await refresh();
      if (!active) return;
      const pending = current.some((r) => r.status === "running" || r.status === "pending");
      if (pending) {
        // dev: advance the poller server-side, then schedule another tick
        await advanceScreenPoll().catch(() => {});
        timer.current = setTimeout(tick, 2000);
      }
    }
    tick();
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh]);

  const { done, running, maxAffinity } = useMemo(() => {
    const affinities = rows
      .map((r) => r.affinity_pred_value)
      .filter((v): v is number => v != null);
    return {
      done: rows.filter((r) => r.status === "succeeded" || r.status === "failed").length,
      running: rows.some((r) => r.status === "running" || r.status === "pending"),
      maxAffinity: affinities.length ? Math.max(...affinities) : 0,
    };
  }, [rows]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading results…
            </span>
          </div>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <div className="h-4 w-5 animate-pulse rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted/60" />
                </div>
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">Couldn&apos;t load results</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Boxes className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">No predictions yet</p>
            <p className="text-sm text-muted-foreground">
              Start a screen to rank the compound library by predicted affinity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pct = rows.length > 0 ? Math.round((done / rows.length) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              )}
              {done}/{rows.length} complete
            </span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Ranked by predicted affinity (pIC50-like, higher = stronger)
          </span>
        </div>
        <Table>
          <TableHeader className="[&_tr]:border-b">
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Compound</TableHead>
              <TableHead className="text-right">Affinity</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Bind prob.</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Structure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const rank = i + 1;
              const isTop = rank <= 3 && r.status === "succeeded";
              const affBar =
                r.affinity_pred_value != null && maxAffinity > 0
                  ? Math.max(4, Math.round((r.affinity_pred_value / maxAffinity) * 100))
                  : 0;
              return (
                <TableRow
                  key={r.id}
                  className={r.status === "running" ? "bg-secondary/30" : undefined}
                >
                  <TableCell className="text-center">
                    <span
                      className={
                        isTop
                          ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary"
                          : "text-sm tabular-nums text-muted-foreground"
                      }
                    >
                      {rank}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium leading-tight">{r.compound_name}</div>
                    <div className="max-w-[32ch] truncate font-mono text-xs text-muted-foreground">
                      {r.smiles}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums">
                        {fmt(r.affinity_pred_value)}
                      </span>
                      {affBar > 0 && (
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-primary/70"
                            style={{ width: `${affBar}%` }}
                          />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    {fmt(r.affinity_probability_binary)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    {fmt(r.confidence_score, 2)}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!r.structure_url}
                      onClick={() =>
                        r.structure_url &&
                        setViewer({ url: r.structure_url, name: r.compound_name })
                      }
                    >
                      <Boxes className="h-4 w-4" /> 3D
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <StructureDrawer
        open={!!viewer}
        onOpenChange={(o) => !o && setViewer(null)}
        url={viewer?.url ?? null}
        title={viewer?.name ?? ""}
      />
    </Card>
  );
}
