"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const THREEDMOL_SRC = "https://cdn.jsdelivr.net/npm/3dmol@2.4.2/build/3Dmol-min.js";

declare global {
  // eslint-disable-next-line no-var
  var $3Dmol: any;
}

function load3Dmol(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.$3Dmol) return Promise.resolve(window.$3Dmol);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${THREEDMOL_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.$3Dmol));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = THREEDMOL_SRC;
    s.async = true;
    s.onload = () => resolve(window.$3Dmol);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function StructureDrawer({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!open || !url || !mountRef.current) return;
    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const $3Dmol = await load3Dmol();
        const cif = await (await fetch(url)).text();
        if (cancelled || !mountRef.current) return;
        mountRef.current.innerHTML = "";
        const viewer = $3Dmol.createViewer(mountRef.current, {
          backgroundColor: "white",
        });
        const format = url.endsWith(".pdb") ? "pdb" : "cif";
        viewer.addModel(cif, format);
        viewer.setStyle({}, { cartoon: { color: "spectrum" }, stick: { radius: 0.15 } });
        viewer.zoomTo();
        viewer.render();
        setStatus("idle");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent side="right" className="flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Predicted complex structure (Boltz-2).</DialogDescription>
        </DialogHeader>
        <div className="relative flex-1 overflow-hidden rounded-md border bg-white">
          <div ref={mountRef} className="absolute inset-0" />
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Rendering structure…
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Could not load the structure. The structure URL may be unavailable or blocked by CORS.
            </div>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Open structure file
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
