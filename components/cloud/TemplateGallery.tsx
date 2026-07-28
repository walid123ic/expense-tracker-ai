"use client";

import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { TemplateDescriptor, TemplateId, TemplateResult } from "@/lib/cloud/types";

interface TemplateGalleryProps {
  templates: TemplateDescriptor[];
  results: Map<TemplateId, TemplateResult>;
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}

export function TemplateGallery({ templates, results, selected, onSelect }: TemplateGalleryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {templates.map((template) => {
        const result = results.get(template.id);
        const isSelected = template.id === selected;

        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(template.id)}
            className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
              isSelected
                ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/20"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className={`absolute inset-x-0 top-0 h-1 ${template.accent}`} />

            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
              {isSelected && (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={4} />
                </span>
              )}
            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">{template.purpose}</p>

            {result && (
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-[11px]">
                <span className="font-medium tabular-nums text-slate-700">
                  {result.rows.length.toLocaleString()} rows
                </span>
                <span className="text-slate-300">|</span>
                <span className="tabular-nums text-slate-500">
                  {formatCurrency(result.totalAmount)}
                </span>
                <span className="text-slate-300">|</span>
                <span className="truncate text-slate-400">{result.periodLabel}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
