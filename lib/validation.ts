import { CATEGORIES, type ExpenseInput } from "./types";
import { todayIso } from "./format";

export interface ExpenseFormValues {
  date: string;
  amount: string;
  category: string;
  description: string;
}

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};

  if (!values.date) {
    errors.date = "Date is required.";
  } else if (values.date > todayIso()) {
    errors.date = "Date cannot be in the future.";
  }

  if (!values.amount.trim()) {
    errors.amount = "Amount is required.";
  } else {
    const numeric = Number(values.amount);
    if (Number.isNaN(numeric)) {
      errors.amount = "Amount must be a valid number.";
    } else if (numeric <= 0) {
      errors.amount = "Amount must be greater than zero.";
    } else if (numeric > 1_000_000) {
      errors.amount = "Amount seems too large.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(values.amount.trim())) {
      errors.amount = "Amount can have at most 2 decimal places.";
    }
  }

  if (!values.category) {
    errors.category = "Category is required.";
  } else if (!CATEGORIES.includes(values.category as (typeof CATEGORIES)[number])) {
    errors.category = "Select a valid category.";
  }

  const trimmedDescription = values.description.trim();
  if (!trimmedDescription) {
    errors.description = "Description is required.";
  } else if (trimmedDescription.length < 2) {
    errors.description = "Description must be at least 2 characters.";
  } else if (trimmedDescription.length > 200) {
    errors.description = "Description must be under 200 characters.";
  }

  return errors;
}

export function toExpenseInput(values: ExpenseFormValues): ExpenseInput {
  return {
    date: values.date,
    amount: Math.round(Number(values.amount) * 100) / 100,
    category: values.category as ExpenseInput["category"],
    description: values.description.trim(),
  };
}
