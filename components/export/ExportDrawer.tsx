"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Download, Loader2, X } from "lucide-react";
import { CATEGORIES, type Expense } from "@/lib/types";
import { formatCurrency, formatDateDisplay, todayIso } from "@/lib/format";
import { buildSelection, isRangeValid } from "@/lib/export/selection";
import { createInitialOptions, exportOptionsReducer } from "@/lib/export/options";
import { isFilenameValid, sanitizeFilename, withExtension } from "@/lib/export/filename";
import { getFormat } from "@/lib/export/registry";
import { describePhase, useExportJob } from "@/hooks/use-export-job";
import { useToast } from "@/components/ui/Toast";
import { FormatPicker } from "./FormatPicker";
import { RangePicker } from "./RangePicker";
import { CategorySelector } from "./CategorySelector";
import { ExportPreview } from "./ExportPreview";

interface ExportDrawerProps {
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 px-5 py-4 last:border-b-0">
      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ExportDrawer({ open, onClose, expenses }: ExportDrawerProps) {
  const today = useMemo(() => todayIso(), []);
  const [options, dispatch] = useReducer(exportOptionsReducer, today, createInitialOptions);
  const job = useExportJob();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Selection is derived, never stored: every option change re-derives the
  // preview, the counts and the summary from one place.
  const selection = useMemo(
    () => buildSelection(expenses, { range: options.range, categories: options.categories }),
    [expenses, options.range, options.categories]
  );

  // Per-category counts ignore the category filter itself, so the checkboxes
  // keep showing what each category *would* contribute in the chosen range.
  const categoryCounts = useMemo(() => {
    const all = buildSelection(expenses, {
      range: options.range,
      categories: [...CATEGORIES],
    });
    return new Map(all.perCategory.map((entry) => [entry.category, entry]));
  }, [expenses, options.range]);

  const rangeValid = isRangeValid(options.range);
  const filenameValid = isFilenameValid(options.filename);
  const format = getFormat(options.format);
  const canExport = selection.matched > 0 && rangeValid && filenameValid && !job.isBusy;

  const handleClose = useCallback(() => {
    if (job.isBusy) return;
    onClose();
  }, [job.isBusy, onClose]);

  // Open/close side effects: scroll lock, Escape, focus capture and restore.
  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setEntered(true);
      panelRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusTo.current?.focus?.();
    };
  }, [open, handleClose]);

  // Reset the job status when the drawer is reopened.
  useEffect(() => {
    if (open) job.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleExport() {
    const result = await job.run(selection, { ...options, filename: sanitizeFilename(options.filename) });
    if (result.ok) {
      showToast(`Exported ${selection.matched} records to ${result.filename}`, "success");
    } else {
      showToast("Export failed. Please try again.", "error");
    }
  }

  if (!mounted || !open) return null;

  const previewFilename = filenameValid ? withExtension(options.filename, format) : "—";

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="export-drawer-title">
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none transition-transform duration-300 ease-out sm:max-w-lg ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="export-drawer-title" className="text-base font-semibold text-slate-900">
              Export data
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Choose a format, filter the records, then download.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={job.isBusy}
            aria-label="Close export panel"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <Section title="Format" step={1}>
            <FormatPicker
              value={options.format}
              disabled={job.isBusy}
              onChange={(next) => dispatch({ type: "set-format", format: next })}
            />
          </Section>

          <Section title="Date range" step={2}>
            <RangePicker
              range={options.range}
              today={today}
              valid={rangeValid}
              disabled={job.isBusy}
              onChange={(range) => dispatch({ type: "set-range", range })}
              onFieldChange={(field, value) => dispatch({ type: "set-range-field", field, value })}
            />
          </Section>

          <Section title="Categories" step={3}>
            <CategorySelector
              selected={options.categories}
              counts={categoryCounts}
              disabled={job.isBusy}
              onToggle={(category) => dispatch({ type: "toggle-category", category })}
              onSetAll={(categories) => dispatch({ type: "set-categories", categories })}
            />
          </Section>

          <Section title="File name" step={4}>
            <div className="flex items-stretch">
              <input
                type="text"
                value={options.filename}
                disabled={job.isBusy}
                onChange={(e) => dispatch({ type: "set-filename", filename: e.target.value })}
                placeholder="expenses"
                aria-label="File name"
                aria-invalid={!filenameValid}
                className={`min-w-0 flex-1 rounded-l-lg border px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60 ${
                  filenameValid ? "border-slate-200" : "border-red-300"
                }`}
              />
              <span className="flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-500">
                .{format.extension}
              </span>
            </div>
            {!filenameValid && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Enter a file name.
              </p>
            )}
          </Section>

          <Section title="Preview" step={5}>
            <div className="mb-2.5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Records</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                  {selection.matched.toLocaleString()}
                  <span className="ml-1 text-[11px] font-normal text-slate-400">
                    of {selection.sourceTotal.toLocaleString()}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                  {formatCurrency(selection.totalAmount)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Span</p>
                <p className="mt-0.5 truncate text-xs text-slate-600">
                  {selection.earliest && selection.latest
                    ? `${formatDateDisplay(selection.earliest)} – ${formatDateDisplay(selection.latest)}`
                    : "—"}
                </p>
              </div>
            </div>

            <ExportPreview selection={selection} />
          </Section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-5 py-3">
          {job.phase === "done" && job.lastFilename && (
            <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Downloaded <span className="font-medium">{job.lastFilename}</span>
            </p>
          )}
          {job.phase === "error" && (
            <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {job.error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
              {job.isBusy ? describePhase(job.phase) : previewFilename}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={job.isBusy}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={!canExport}
                className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {job.isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export {selection.matched > 0 ? selection.matched.toLocaleString() : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
