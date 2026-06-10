"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
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
  const { theme } = useTheme();

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
          backgroundColor: theme === "dark" ? "#0f172a" : "white",
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
  }, [open, url, theme]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent side="right" className="flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle className="text-balance">{title}</DialogTitle>
          <DialogDescription>
            Predicted complex structure (Boltz-2). Drag to rotate, scroll to zoom.
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex-1 overflow-hidden rounded-md border bg-muted/30">
          <div ref={mountRef} className="absolute inset-0" />
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Rendering structure…
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Could not load the structure. The structure URL may be unavailable or blocked by
              CORS.
            </div>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open structure file
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
