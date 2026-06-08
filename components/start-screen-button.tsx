"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fans out a screen over the full compound library, then nudges the poller so
// results land quickly in dev (in prod the Vercel cron drives polling).
export function StartScreenButton({
  projectId,
  compoundCount,
}: {
  projectId: string;
  compoundCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setMsg("Loading compounds…");
    try {
      const compounds = (await (await fetch("/api/compounds")).json()).compounds as {
        id: string;
      }[];
      setMsg(`Fanning out ${compounds.length} predictions…`);
      const res = await fetch("/api/screens/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, compoundIds: compounds.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "start failed");

      const result = await res.json();
      if (typeof pendo !== "undefined") {
        pendo.track("screening_started", {
          screenId: result.screenId ?? "",
          projectId,
          compoundCount: compounds.length,
          predictionsStarted: result.predictionsStarted ?? compounds.length,
          targetName: result.targetName ?? "",
        });
      }

      setMsg("Screen running. Results will populate as predictions complete.");
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <Button onClick={start} disabled={busy || compoundCount === 0}>
        <Play className="h-4 w-4" /> {busy ? "Starting…" : `Start screen (${compoundCount})`}
      </Button>
      {msg && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
