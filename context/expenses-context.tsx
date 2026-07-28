"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Expense, ExpenseInput } from "@/lib/types";
import { loadExpenses, saveExpenses, StorageError } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";

interface ExpensesContextValue {
  expenses: Expense[];
  isLoading: boolean;
  addExpense: (input: ExpenseInput) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setExpenses(loadExpenses());
    setIsLoading(false);
  }, []);

  const persist = useCallback(
    (next: Expense[]) => {
      setExpenses(next);
      try {
        saveExpenses(next);
      } catch (err) {
        if (err instanceof StorageError) {
          showToast(err.message, "error");
        }
      }
    },
    [showToast]
  );

  const addExpense = useCallback(
    (input: ExpenseInput) => {
      const now = new Date().toISOString();
      const expense: Expense = {
        id: createId(),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      persist([expense, ...expenses]);
      showToast("Expense added successfully.", "success");
    },
    [expenses, persist, showToast]
  );

  const updateExpense = useCallback(
    (id: string, input: ExpenseInput) => {
      const now = new Date().toISOString();
      const next = expenses.map((expense) =>
        expense.id === id ? { ...expense, ...input, updatedAt: now } : expense
      );
      persist(next);
      showToast("Expense updated successfully.", "success");
    },
    [expenses, persist, showToast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const next = expenses.filter((expense) => expense.id !== id);
      persist(next);
      showToast("Expense deleted.", "info");
    },
    [expenses, persist, showToast]
  );

  const value = useMemo(
    () => ({ expenses, isLoading, addExpense, updateExpense, deleteExpense }),
    [expenses, isLoading, addExpense, updateExpense, deleteExpense]
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used within an ExpensesProvider");
  return ctx;
}
