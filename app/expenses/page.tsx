"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useExpenses } from "@/context/expenses-context";
import { DEFAULT_FILTERS, type Expense, type ExpenseFilters as ExpenseFiltersType } from "@/lib/types";
import { applyFilters } from "@/lib/filters";
import { expensesToCsv, downloadCsv } from "@/lib/csv";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function ExpensesPage() {
  const { expenses, isLoading } = useExpenses();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<ExpenseFiltersType>(DEFAULT_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  const filteredExpenses = useMemo(() => applyFilters(expenses, filters), [expenses, filters]);

  function handleExport() {
    if (filteredExpenses.length === 0) {
      showToast("There are no expenses to export.", "error");
      return;
    }
    const csv = expensesToCsv(filteredExpenses);
    const filename = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
    showToast(`Exported ${filteredExpenses.length} expenses to CSV.`, "success");
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
  }

  function closeModal() {
    setAddOpen(false);
    setEditingExpense(undefined);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">Search, filter, and manage every expense.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      <ExpenseFilters
        filters={filters}
        onChange={setFilters}
        onExport={handleExport}
        resultCount={filteredExpenses.length}
      />

      <ExpenseList expenses={filteredExpenses} onEdit={handleEdit} />

      <ExpenseFormModal
        open={addOpen || Boolean(editingExpense)}
        onClose={closeModal}
        editingExpense={editingExpense}
      />
    </div>
  );
}
