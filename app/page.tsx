"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { useExpenses } from "@/context/expenses-context";
import { computeDashboardStats } from "@/lib/stats";
import { expensesToCsv, downloadCsv } from "@/lib/csv";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { SpendingTrendChart } from "@/components/dashboard/SpendingTrendChart";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { expenses, isLoading } = useExpenses();
  const stats = useMemo(() => computeDashboardStats(expenses), [expenses]);

  function handleExport() {
    const csv = expensesToCsv(expenses);
    const filename = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            A snapshot of your spending across all categories.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={expenses.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      <SummaryCards stats={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Spending by Category</h3>
          <CategoryBreakdownChart breakdown={stats.categoryBreakdown} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Monthly Trend</h3>
          <SpendingTrendChart trend={stats.monthlyTrend} />
        </div>
      </div>

      <RecentExpenses expenses={expenses} />
    </div>
  );
}
