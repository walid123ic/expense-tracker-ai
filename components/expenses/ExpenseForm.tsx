"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES, type Expense, type ExpenseInput } from "@/lib/types";
import { todayIso } from "@/lib/format";
import {
  validateExpenseForm,
  toExpenseInput,
  type ExpenseFormValues,
  type ExpenseFormErrors,
} from "@/lib/validation";

interface ExpenseFormProps {
  initialExpense?: Expense;
  onSubmit: (input: ExpenseInput) => void;
  onCancel: () => void;
}

function toFormValues(expense?: Expense): ExpenseFormValues {
  if (!expense) {
    return { date: todayIso(), amount: "", category: "", description: "" };
  }
  return {
    date: expense.date,
    amount: String(expense.amount),
    category: expense.category,
    description: expense.description,
  };
}

const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

export function ExpenseForm({ initialExpense, onSubmit, onCancel }: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(toFormValues(initialExpense));
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ExpenseFormValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialExpense);

  function setField<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) {
      setErrors(validateExpenseForm(next));
    }
  }

  function handleBlur(key: keyof ExpenseFormValues) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors(validateExpenseForm(values));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateExpenseForm(values);
    setErrors(validationErrors);
    setTouched({ date: true, amount: true, category: true, description: true });

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    onSubmit(toExpenseInput(values));
  }

  function fieldClass(key: keyof ExpenseFormValues) {
    return errors[key] ? `${inputBase} border-red-300 focus:ring-red-500/30` : `${inputBase} border-slate-200`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-slate-700">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={values.date}
          max={todayIso()}
          onChange={(e) => setField("date", e.target.value)}
          onBlur={() => handleBlur("date")}
          className={fieldClass("date")}
        />
        {errors.date && <p className="mt-1.5 text-xs text-red-600">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-slate-700">
          Amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            $
          </span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={values.amount}
            onChange={(e) => setField("amount", e.target.value)}
            onBlur={() => handleBlur("amount")}
            className={`${fieldClass("amount")} pl-6`}
          />
        </div>
        {errors.amount && <p className="mt-1.5 text-xs text-red-600">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          id="category"
          value={values.category}
          onChange={(e) => setField("category", e.target.value)}
          onBlur={() => handleBlur("category")}
          className={fieldClass("category")}
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1.5 text-xs text-red-600">{errors.category}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          placeholder="e.g. Grocery shopping at Whole Foods"
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          onBlur={() => handleBlur("description")}
          className={`${fieldClass("description")} resize-none`}
        />
        {errors.description && <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEditing ? "Save Changes" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
