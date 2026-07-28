import type { Expense } from "./types";

const STORAGE_KEY = "expense-tracker:expenses:v1";

export class StorageError extends Error {}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadExpenses(): Expense[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Expense[];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    throw new StorageError(
      "Unable to save expenses. Your browser storage may be full or disabled."
    );
  }
}
