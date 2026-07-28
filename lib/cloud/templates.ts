import { CATEGORIES, type Category, type Expense } from "@/lib/types";
import { formatCurrency, formatDateDisplay, monthLabel, monthKey } from "@/lib/format";
import type { TemplateDescriptor, TemplateId, TemplateResult } from "./types";

function sum(expenses: Expense[]): number {
  return Math.round(expenses.reduce((total, e) => total + e.amount, 0) * 100) / 100;
}

function byDateDesc(a: Expense, b: Expense): number {
  return a.date === b.date ? a.id.localeCompare(b.id) : b.date.localeCompare(a.date);
}

/**
 * Tax year runs Jan 1 - Dec 31 here. Before April the previous year is the one
 * people are actually filing, so that is what the template defaults to.
 */
function taxYearFor(today: string): number {
  const [year, month] = today.split("-").map(Number);
  return month <= 3 ? year - 1 : year;
}

const taxReport: TemplateDescriptor = {
  id: "tax-report",
  name: "Tax Report",
  purpose: "Deductible-friendly ledger for a single tax year, grouped by category.",
  accent: "bg-amber-500",

  build(expenses, today): TemplateResult {
    const year = taxYearFor(today);
    const inYear = expenses.filter((e) => e.date.startsWith(String(year))).sort(byDateDesc);

    const rows = inYear.map((expense) => ({
      date: formatDateDisplay(expense.date),
      category: expense.category,
      description: expense.description,
      amount: formatCurrency(expense.amount),
    }));

    return {
      columns: [
        { key: "date", label: "Date" },
        { key: "category", label: "Category" },
        { key: "description", label: "Description" },
        { key: "amount", label: "Amount", align: "right" },
      ],
      rows,
      recordCount: inYear.length,
      totalAmount: sum(inYear),
      periodLabel: `Tax year ${year}`,
      headline: `${inYear.length} transactions totalling ${formatCurrency(sum(inYear))} in ${year}`,
    };
  },
};

const monthlySummary: TemplateDescriptor = {
  id: "monthly-summary",
  name: "Monthly Summary",
  purpose: "One row per month per category, for tracking trends over time.",
  accent: "bg-indigo-500",

  build(expenses): TemplateResult {
    const buckets = new Map<string, Map<Category, Expense[]>>();

    for (const expense of expenses) {
      const key = monthKey(expense.date);
      if (!buckets.has(key)) buckets.set(key, new Map());
      const categories = buckets.get(key)!;
      categories.set(expense.category, [...(categories.get(expense.category) ?? []), expense]);
    }

    const rows: Array<Record<string, string>> = [];
    const months: string[] = [];
    buckets.forEach((_, key) => months.push(key));
    months.sort().reverse();

    for (const month of months) {
      const categories = buckets.get(month)!;
      for (const category of CATEGORIES) {
        const items = categories.get(category);
        if (!items || items.length === 0) continue;
        rows.push({
          month: monthLabel(month),
          category,
          count: String(items.length),
          total: formatCurrency(sum(items)),
          average: formatCurrency(Math.round((sum(items) / items.length) * 100) / 100),
        });
      }
    }

    return {
      columns: [
        { key: "month", label: "Month" },
        { key: "category", label: "Category" },
        { key: "count", label: "Count", align: "right" },
        { key: "total", label: "Total", align: "right" },
        { key: "average", label: "Average", align: "right" },
      ],
      rows,
      recordCount: expenses.length,
      totalAmount: sum(expenses),
      periodLabel: months.length ? `${months.length} months` : "No data",
      headline: `${rows.length} month/category rows across ${months.length} months`,
    };
  },
};

const categoryAnalysis: TemplateDescriptor = {
  id: "category-analysis",
  name: "Category Analysis",
  purpose: "Share of spend per category with averages and extremes.",
  accent: "bg-emerald-500",

  build(expenses): TemplateResult {
    const total = sum(expenses);

    const rows = CATEGORIES.map((category) => {
      const items = expenses.filter((e) => e.category === category);
      if (items.length === 0) return null;
      const categoryTotal = sum(items);
      const largest = items.reduce((max, e) => (e.amount > max.amount ? e : max), items[0]);

      return {
        category,
        count: String(items.length),
        total: formatCurrency(categoryTotal),
        share: total > 0 ? `${((categoryTotal / total) * 100).toFixed(1)}%` : "0.0%",
        average: formatCurrency(Math.round((categoryTotal / items.length) * 100) / 100),
        largest: `${formatCurrency(largest.amount)} — ${largest.description}`,
      };
    }).filter((row): row is NonNullable<typeof row> => row !== null);

    rows.sort((a, b) => Number(b.count) - Number(a.count));

    return {
      columns: [
        { key: "category", label: "Category" },
        { key: "count", label: "Records", align: "right" },
        { key: "total", label: "Total", align: "right" },
        { key: "share", label: "Share", align: "right" },
        { key: "average", label: "Average", align: "right" },
        { key: "largest", label: "Largest single expense" },
      ],
      rows,
      recordCount: expenses.length,
      totalAmount: total,
      periodLabel: "All time",
      headline: `${rows.length} active categories, ${formatCurrency(total)} total`,
    };
  },
};

const rawLedger: TemplateDescriptor = {
  id: "raw-ledger",
  name: "Raw Ledger",
  purpose: "Every field of every record, unaggregated. For archives and migrations.",
  accent: "bg-slate-500",

  build(expenses): TemplateResult {
    const sorted = [...expenses].sort(byDateDesc);

    return {
      columns: [
        { key: "id", label: "ID" },
        { key: "date", label: "Date" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Created" },
      ],
      rows: sorted.map((expense) => ({
        id: expense.id,
        date: expense.date,
        category: expense.category,
        amount: expense.amount.toFixed(2),
        description: expense.description,
        createdAt: expense.createdAt,
      })),
      recordCount: sorted.length,
      totalAmount: sum(sorted),
      periodLabel: "All time",
      headline: `Complete archive of ${sorted.length} records`,
    };
  },
};

export const TEMPLATES: TemplateDescriptor[] = [
  taxReport,
  monthlySummary,
  categoryAnalysis,
  rawLedger,
];

export function getTemplate(id: TemplateId): TemplateDescriptor {
  const template = TEMPLATES.find((t) => t.id === id);
  if (!template) throw new Error(`Unknown template: ${id}`);
  return template;
}
