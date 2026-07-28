import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import type { Expense } from "@/lib/types";
import { formatCurrency, formatDateDisplay } from "@/lib/format";
import { CategoryBadge } from "@/components/expenses/CategoryBadge";

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const recent = expenses
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Recent Expenses</h3>
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
          <Receipt className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No expenses recorded yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {recent.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{expense.description}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDateDisplay(expense.date)}</p>
              </div>
              <CategoryBadge category={expense.category} />
              <span className="w-20 shrink-0 text-right text-sm font-semibold text-slate-900">
                {formatCurrency(expense.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
