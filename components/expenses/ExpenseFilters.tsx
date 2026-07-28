"use client";

import { Search, Download, X } from "lucide-react";
import { CATEGORIES, type ExpenseFilters as ExpenseFiltersType, type SortOption } from "@/lib/types";

interface ExpenseFiltersProps {
  filters: ExpenseFiltersType;
  onChange: (filters: ExpenseFiltersType) => void;
  onExport: () => void;
  resultCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high to low" },
  { value: "amount-asc", label: "Amount: low to high" },
];

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

export function ExpenseFilters({ filters, onChange, onExport, resultCount }: ExpenseFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.category !== "All" || filters.dateFrom || filters.dateTo;

  function update<K extends keyof ExpenseFiltersType>(key: K, value: ExpenseFiltersType[K]) {
    onChange({ ...filters, [key]: value });
  }

  function clearFilters() {
    onChange({ search: "", category: "All", dateFrom: "", dateTo: "", sortBy: filters.sortBy });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description or category..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <button
          onClick={onExport}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={filters.category}
          onChange={(e) => update("category", e.target.value as ExpenseFiltersType["category"])}
          className={selectClass}
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
            className={selectClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
            className={selectClass}
          />
        </div>

        <select
          value={filters.sortBy}
          onChange={(e) => update("sortBy", e.target.value as SortOption)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500">
          {resultCount} {resultCount === 1 ? "expense" : "expenses"}
        </span>
      </div>
    </div>
  );
}
