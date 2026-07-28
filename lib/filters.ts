import type { Expense, ExpenseFilters } from "./types";

export function applyFilters(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const search = filters.search.trim().toLowerCase();

  let result = expenses.filter((expense) => {
    if (filters.category !== "All" && expense.category !== filters.category) {
      return false;
    }
    if (filters.dateFrom && expense.date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && expense.date > filters.dateTo) {
      return false;
    }
    if (search) {
      const haystack = `${expense.description} ${expense.category}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  result = result.slice().sort((a, b) => {
    switch (filters.sortBy) {
      case "date-asc":
        return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "date-desc":
      default:
        return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    }
  });

  return result;
}
