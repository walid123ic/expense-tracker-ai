"use client";

import { Check } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface CategorySelectorProps {
  selected: Category[];
  counts: Map<Category, { count: number; amount: number }>;
  onToggle: (category: Category) => void;
  onSetAll: (categories: Category[]) => void;
  disabled?: boolean;
}

export function CategorySelector({
  selected,
  counts,
  onToggle,
  onSetAll,
  disabled,
}: CategorySelectorProps) {
  const allSelected = selected.length === CATEGORIES.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {selected.length} of {CATEGORIES.length} selected
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSetAll(allSelected ? [] : [...CATEGORIES])}
          className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 disabled:opacity-50"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {CATEGORIES.map((category) => {
          const isSelected = selected.includes(category);
          const stats = counts.get(category);
          const isEmpty = !stats || stats.count === 0;

          return (
            <button
              key={category}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onToggle(category)}
              title={isEmpty ? "No records in the current date range" : undefined}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-indigo-200 bg-indigo-50/70"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-slate-800">{category}</span>
                <span className={`block text-[10px] ${isEmpty ? "text-slate-300" : "text-slate-500"}`}>
                  {isEmpty ? "no records" : `${stats.count} · ${formatCurrency(stats.amount)}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
