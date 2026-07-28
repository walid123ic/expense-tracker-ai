"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFormat } from "@/lib/export/registry";
import { triggerDownload } from "@/lib/export/download";
import { withExtension } from "@/lib/export/filename";
import type { ExportOptions, ExportSelection } from "@/lib/export/types";

export type ExportPhase = "idle" | "preparing" | "rendering" | "delivering" | "done" | "error";

export interface ExportJobState {
  phase: ExportPhase;
  error: string | null;
  lastFilename: string | null;
}

const PHASE_LABELS: Record<ExportPhase, string> = {
  idle: "",
  preparing: "Collecting records...",
  rendering: "Generating file...",
  delivering: "Starting download...",
  done: "Export complete",
  error: "Export failed",
};

export function describePhase(phase: ExportPhase): string {
  return PHASE_LABELS[phase];
}

/** Keeps a phase on screen long enough to actually be read. */
function hold(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const INITIAL: ExportJobState = { phase: "idle", error: null, lastFilename: null };

export function useExportJob() {
  const [state, setState] = useState<ExportJobState>(INITIAL);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const set = useCallback((next: Partial<ExportJobState>) => {
    if (mounted.current) setState((prev) => ({ ...prev, ...next }));
  }, []);

  const reset = useCallback(() => set(INITIAL), [set]);

  const run = useCallback(
    async (selection: ExportSelection, options: ExportOptions) => {
      const format = getFormat(options.format);
      const filename = withExtension(options.filename, format);

      try {
        set({ phase: "preparing", error: null, lastFilename: null });
        await hold(180);

        set({ phase: "rendering" });
        // Yield to the browser so the spinner paints before a large
        // synchronous render (the PDF writer) blocks the main thread.
        await hold(0);
        const blob = await format.build(selection, options);

        set({ phase: "delivering" });
        await hold(120);
        triggerDownload(blob, filename);

        set({ phase: "done", lastFilename: filename });
        return { ok: true as const, filename };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        set({ phase: "error", error: message });
        return { ok: false as const, error: message };
      }
    },
    [set]
  );

  const isBusy = state.phase === "preparing" || state.phase === "rendering" || state.phase === "delivering";

  return { ...state, isBusy, run, reset };
}
