"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
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
      return <Badge variant="default">succeeded</Badge>;
    case "running":
      return (
        <Badge variant="secondary">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> running
        </Badge>
      );
    case "pending":
      return <Badge variant="muted">pending</Badge>;
    case "failed":
      return <Badge variant="destructive">failed</Badge>;
  }
}

const fmt = (v: number | null, d = 3) => (v == null ? "—" : v.toFixed(d));

export function ResultsTable({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const data = (await (
      await fetch(`/api/results?projectId=${projectId}`, { cache: "no-store" })
    ).json()) as { results: ResultRow[] };
    setRows(data.results ?? []);
    setLoading(false);
    return data.results ?? [];
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading results…
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No predictions yet. Start a screen to rank the compound library.
        </CardContent>
      </Card>
    );
  }

  const done = rows.filter((r) => r.status === "succeeded" || r.status === "failed").length;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
          <span>
            {done}/{rows.length} complete
          </span>
          <span>Ranked by predicted affinity (pIC50-like, higher = stronger)</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Compound</TableHead>
              <TableHead className="text-right">Affinity</TableHead>
              <TableHead className="text-right">Bind prob.</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Structure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="font-medium">{r.compound_name}</div>
                  <div className="max-w-[28ch] truncate font-mono text-xs text-muted-foreground">
                    {r.smiles}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {fmt(r.affinity_pred_value)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt(r.affinity_probability_binary)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
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
            ))}
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
