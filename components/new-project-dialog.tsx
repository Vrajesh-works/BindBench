"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// CA2 prefilled as a sensible demo default.
const CA2 =
  "MSHHWGYGKHNGPEHWHKDFPIAKGERQSPVDIDTHTAKYDPSLKPLSVSYDQATSLRILNNGHAFNVEFDDSQDKAVLKGGPLDGTYRLIQFHFHWGSLDGQGSEHTVDKKKYAAELHLVHWNTKYGDFGKAVQQPDGLAVLGIFLKVGSAKPGLQKVVDVLDSIKTKGKSADFTNFDPRGLLPESLDYWTYPGSLTTPPLLECVTWIVLKEPISVSSEQVLKFRKLNFNGEGEPEELMVDNWRPAQPLKNRQIKASFK";

/** Strip FASTA header lines (starting with ">") and all whitespace. */
function cleanSequence(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(">"))
    .join("")
    .replace(/\s/g, "")
    .toUpperCase();
}

const VALID_AA = /^[ACDEFGHIKLMNPQRSTVWY]+$/;

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetName, setTargetName] = useState("Carbonic Anhydrase II");
  const [sequence, setSequence] = useState(CA2);

  const cleaned = useMemo(() => cleanSequence(sequence), [sequence]);
  const hasInvalidChars = cleaned.length > 0 && !VALID_AA.test(cleaned);
  const canSubmit =
    name.trim().length > 0 &&
    targetName.trim().length > 0 &&
    cleaned.length > 0 &&
    !hasInvalidChars &&
    !saving;

  function resetForm() {
    setName("");
    setDescription("");
    setTargetName("Carbonic Anhydrase II");
    setSequence(CA2);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const body = {
      name: name.trim(),
      description: description.trim(),
      target: { name: targetName.trim(), sequence: cleaned },
    };

    let res: Response;
    try {
      res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setSaving(false);
      setError("Network error — please check your connection and try again.");
      return;
    }
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create project");
      return;
    }

    const result = await res.json();
    if (typeof pendo !== "undefined") {
      pendo.track("project_created", {
        projectId: result.id ?? "",
        projectName: body.name,
        targetName: body.target.name,
        sequenceLength: body.target.sequence.length,
        hasDescription: Boolean(body.description),
      });
    }

    setOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A project pairs a protein target with a screening campaign.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="CA2 inhibitor screen"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="targetName">Target name</Label>
            <Input
              id="targetName"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="sequence">Target protein sequence (FASTA)</Label>
              <span
                className={
                  hasInvalidChars
                    ? "text-xs tabular-nums text-destructive"
                    : "text-xs tabular-nums text-muted-foreground"
                }
              >
                {cleaned.length} aa
              </span>
            </div>
            <Textarea
              id="sequence"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              required
              rows={4}
              className="font-mono text-xs"
              placeholder=">sp|P00918|CAH2_HUMAN&#10;MSHHWGYGK…"
            />
            {hasInvalidChars ? (
              <p className="text-xs text-destructive">
                Sequence contains non-standard characters. Use the 20 standard amino-acid letters.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                FASTA header lines and whitespace are stripped automatically.
              </p>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
