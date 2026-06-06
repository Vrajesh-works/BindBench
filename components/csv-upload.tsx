"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = { name?: string; smiles?: string; source?: string };

// Parses a CSV (name, smiles, source?) client-side and bulk-inserts via the API.
export function CsvUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pick() {
    inputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("Parsing…");
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const compounds = res.data
          .filter((r) => r.name && r.smiles)
          .map((r) => ({ name: r.name!.trim(), smiles: r.smiles!.trim(), source: r.source ?? "csv" }));
        if (compounds.length === 0) {
          setMsg("No valid rows (need name, smiles columns).");
          setBusy(false);
          return;
        }
        const r = await fetch("/api/compounds", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ compounds }),
        });
        setBusy(false);
        if (!r.ok) {
          setMsg((await r.json()).error ?? "Upload failed");
          return;
        }
        const { inserted } = await r.json();
        setMsg(`Added ${inserted} compounds.`);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      },
      error: (err) => {
        setMsg(err.message);
        setBusy(false);
      },
    });
  }

  return (
    <div className="text-right">
      <input ref={inputRef} type="file" accept=".csv" hidden onChange={onFile} />
      <Button onClick={pick} disabled={busy}>
        <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload CSV"}
      </Button>
      {msg && <p className="mt-1 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
