"use client";

import { Table2 } from "lucide-react";
import { formatCurrency, formatDateDisplay } from "@/lib/format";
import type { ExportSelection } from "@/lib/export/types";

const PREVIEW_ROWS = 6;

export function ExportPreview({ selection }: { selection: ExportSelection }) {
  const visible = selection.rows.slice(0, PREVIEW_ROWS);
  const hidden = selection.matched - visible.length;

  if (selection.matched === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
        <Table2 className="mx-auto h-5 w-5 text-slate-300" />
        <p className="mt-2 text-xs font-medium text-slate-500">No records match these filters</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Widen the date range or select more categories.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-56 overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Date</th>
              <th scope="col" className="px-3 py-2 font-semibold">Category</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Amount</th>
              <th scope="col" className="px-3 py-2 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((expense) => (
              <tr key={expense.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                  {formatDateDisplay(expense.date)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                  {expense.category}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium tabular-nums text-slate-900">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="max-w-[1px] truncate px-3 py-2 text-xs text-slate-500">
                  {expense.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hidden > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-1.5 text-center text-[11px] text-slate-500">
          + {hidden.toLocaleString()} more {hidden === 1 ? "record" : "records"} in the export
        </div>
      )}
    </div>
  );
}
