"use client";

import { AlertCircle } from "lucide-react";
import { rangesEqual, resolvePreset, type RangePresetId } from "@/lib/export/selection";
import type { DateRange } from "@/lib/export/types";

const PRESETS: Array<{ id: RangePresetId; label: string }> = [
  { id: "all", label: "All time" },
  { id: "this-month", label: "This month" },
  { id: "last-30", label: "Last 30 days" },
  { id: "ytd", label: "Year to date" },
];

interface RangePickerProps {
  range: DateRange;
  today: string;
  valid: boolean;
  onChange: (range: DateRange) => void;
  onFieldChange: (field: keyof DateRange, value: string) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60";

export function RangePicker({
  range,
  today,
  valid,
  onChange,
  onFieldChange,
  disabled,
}: RangePickerProps) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const presetRange = resolvePreset(preset.id, today);
          const active = rangesEqual(presetRange, range);

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(presetRange)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-60 ${
                active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-slate-500">Start date</span>
          <input
            type="date"
            value={range.from}
            max={today}
            disabled={disabled}
            onChange={(e) => onFieldChange("from", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-slate-500">End date</span>
          <input
            type="date"
            value={range.to}
            max={today}
            disabled={disabled}
            onChange={(e) => onFieldChange("to", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {!valid && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Start date must be on or before the end date.
        </p>
      )}
    </div>
  );
}
