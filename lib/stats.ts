import type { Category, Expense } from "./types";
import { CATEGORIES } from "./types";
import { monthKey, monthLabel, todayIso } from "./format";

export interface DashboardStats {
  totalAllTime: number;
  totalThisMonth: number;
  totalLastMonth: number;
  monthOverMonthPct: number | null;
  transactionCountThisMonth: number;
  topCategory: { category: Category; amount: number } | null;
  categoryBreakdown: { category: Category; amount: number; percent: number }[];
  monthlyTrend: { key: string; label: string; amount: number }[];
}

function currentMonthKey(): string {
  return monthKey(todayIso());
}

function previousMonthKey(): string {
  const today = new Date();
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return monthKey(
    `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`
  );
}

export function computeDashboardStats(expenses: Expense[]): DashboardStats {
  const thisMonth = currentMonthKey();
  const lastMonth = previousMonthKey();

  const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpenses = expenses.filter((e) => monthKey(e.date) === thisMonth);
  const lastMonthExpenses = expenses.filter((e) => monthKey(e.date) === lastMonth);

  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthOverMonthPct =
    totalLastMonth > 0
      ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
      : totalThisMonth > 0
        ? 100
        : null;

  const categoryTotals = new Map<Category, number>();
  for (const category of CATEGORIES) categoryTotals.set(category, 0);
  for (const expense of expenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  }

  const categoryBreakdown = CATEGORIES.map((category) => {
    const amount = categoryTotals.get(category) ?? 0;
    return {
      category,
      amount,
      percent: totalAllTime > 0 ? (amount / totalAllTime) * 100 : 0,
    };
  })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  const trendMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMap.set(key, 0);
  }
  for (const expense of expenses) {
    const key = monthKey(expense.date);
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + expense.amount);
    }
  }
  const monthlyTrend = Array.from(trendMap.entries()).map(([key, amount]) => ({
    key,
    label: monthLabel(key),
    amount,
  }));

  return {
    totalAllTime,
    totalThisMonth,
    totalLastMonth,
    monthOverMonthPct,
    transactionCountThisMonth: thisMonthExpenses.length,
    topCategory,
    categoryBreakdown,
    monthlyTrend,
  };
}
