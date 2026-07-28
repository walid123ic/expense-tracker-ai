"use client";

import { FileJson, FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";
import { EXPORT_FORMATS } from "@/lib/export/registry";
import type { ExportFormatId } from "@/lib/export/types";

const ICONS: Record<ExportFormatId, LucideIcon> = {
  csv: FileSpreadsheet,
  json: FileJson,
  pdf: FileText,
};

interface FormatPickerProps {
  value: ExportFormatId;
  onChange: (format: ExportFormatId) => void;
  disabled?: boolean;
}

export function FormatPicker({ value, onChange, disabled }: FormatPickerProps) {
  return (
    <div role="radiogroup" aria-label="Export format" className="grid grid-cols-1 gap-2">
      {EXPORT_FORMATS.map((format) => {
        const Icon = ICONS[format.id];
        const selected = value === format.id;

        return (
          <button
            key={format.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(format.id)}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
              selected
                ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500/30"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{format.label}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-500">
                  .{format.extension}
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                {format.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
