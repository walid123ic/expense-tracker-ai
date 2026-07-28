import { CATEGORIES, type Category, type Expense } from "@/lib/types";
import type { DateRange, ExportOptions, ExportSelection } from "./types";

/**
 * ISO yyyy-MM-dd strings compare correctly with < and >, so no Date parsing
 * (and no timezone hazard) is needed for range filtering.
 */
export function isWithinRange(isoDate: string, range: DateRange): boolean {
  if (range.from && isoDate < range.from) return false;
  if (range.to && isoDate > range.to) return false;
  return true;
}

export function buildSelection(
  expenses: Expense[],
  options: Pick<ExportOptions, "range" | "categories">
): ExportSelection {
  const allowed = new Set<Category>(options.categories);

  const rows = expenses
    .filter((e) => allowed.has(e.category) && isWithinRange(e.date, options.range))
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : b.date.localeCompare(a.date)));

  const totalAmount = rows.reduce((sum, e) => sum + e.amount, 0);

  const perCategory = CATEGORIES.map((category) => {
    const inCategory = rows.filter((e) => e.category === category);
    return {
      category,
      count: inCategory.length,
      amount: inCategory.reduce((sum, e) => sum + e.amount, 0),
    };
  }).filter((entry) => entry.count > 0);

  // rows is sorted newest-first, so the ends of the array are the date bounds.
  return {
    rows,
    matched: rows.length,
    sourceTotal: expenses.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    earliest: rows.length ? rows[rows.length - 1].date : null,
    latest: rows.length ? rows[0].date : null,
    perCategory,
  };
}

/** Presets offered above the manual date inputs. */
export type RangePresetId = "all" | "this-month" | "last-30" | "ytd";

export function resolvePreset(id: RangePresetId, today: string): DateRange {
  const [year, month] = today.split("-");

  switch (id) {
    case "this-month":
      return { from: `${year}-${month}-01`, to: today };
    case "last-30": {
      const d = new Date(`${today}T00:00:00`);
      d.setDate(d.getDate() - 29);
      return { from: d.toISOString().slice(0, 10), to: today };
    }
    case "ytd":
      return { from: `${year}-01-01`, to: today };
    case "all":
    default:
      return { from: "", to: "" };
  }
}

export function rangesEqual(a: DateRange, b: DateRange): boolean {
  return a.from === b.from && a.to === b.to;
}

export function describeRange(range: DateRange): string {
  if (!range.from && !range.to) return "All dates";
  if (range.from && !range.to) return `From ${range.from}`;
  if (!range.from && range.to) return `Up to ${range.to}`;
  return `${range.from} to ${range.to}`;
}

export function isRangeValid(range: DateRange): boolean {
  if (!range.from || !range.to) return true;
  return range.from <= range.to;
}
