"use client";

import { useState } from "react";
import { Pencil, Trash2, Receipt } from "lucide-react";
import type { Expense } from "@/lib/types";
import { formatCurrency, formatDateDisplay } from "@/lib/format";
import { useExpenses } from "@/context/expenses-context";
import { CategoryBadge } from "./CategoryBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onEdit }: ExpenseListProps) {
  const { deleteExpense } = useExpenses();
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Receipt className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900">No expenses found</p>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your filters, or add a new expense to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Desktop table */}
        <table className="hidden w-full text-left text-sm sm:table">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDateDisplay(expense.date)}
                </td>
                <td className="px-4 py-3">
                  <CategoryBadge category={expense.category} />
                </td>
                <td className="px-4 py-3 text-slate-700">{expense.description}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(expense)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                      aria-label={`Edit ${expense.description}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPendingDelete(expense)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${expense.description}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <ul className="divide-y divide-slate-100 sm:hidden">
          {expenses.map((expense) => (
            <li key={expense.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{expense.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDateDisplay(expense.date)}</p>
                  <div className="mt-2">
                    <CategoryBadge category={expense.category} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold text-slate-900">{formatCurrency(expense.amount)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(expense)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                      aria-label={`Edit ${expense.description}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPendingDelete(expense)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${expense.description}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete expense"
        description={`Are you sure you want to delete "${pendingDelete?.description}"? This action cannot be undone.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteExpense(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
