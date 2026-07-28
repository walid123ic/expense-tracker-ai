import { Wallet, CalendarDays, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import type { DashboardStats } from "@/lib/stats";
import { formatCurrency } from "@/lib/format";
import { CATEGORY_META } from "@/lib/categories";

interface SummaryCardsProps {
  stats: DashboardStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const { totalAllTime, totalThisMonth, monthOverMonthPct, topCategory, transactionCountThisMonth } = stats;

  const trendUp = monthOverMonthPct !== null && monthOverMonthPct > 0;
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Total Spent</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
            <Wallet className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totalAllTime)}</p>
        <p className="mt-1 text-xs text-slate-400">All-time across all categories</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">This Month</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totalThisMonth)}</p>
        {monthOverMonthPct !== null ? (
          <p
            className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${trendUp ? "text-red-500" : "text-emerald-600"}`}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(monthOverMonthPct).toFixed(0)}% vs last month
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">No data for last month</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Top Category</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
            <PieChart className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        {topCategory ? (
          <>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{topCategory.category}</p>
            <p className="mt-1 text-xs text-slate-400">
              {formatCurrency(topCategory.amount)} spent
              <span
                className="ml-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: CATEGORY_META[topCategory.category].color }}
              />
            </p>
          </>
        ) : (
          <p className="mt-3 text-2xl font-semibold text-slate-300">—</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Transactions</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
            <Wallet className="h-5 w-5 text-orange-600" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-semibold text-slate-900">{transactionCountThisMonth}</p>
        <p className="mt-1 text-xs text-slate-400">Recorded this month</p>
      </div>
    </div>
  );
}
