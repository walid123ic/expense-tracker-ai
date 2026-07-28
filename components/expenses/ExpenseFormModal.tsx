"use client";

import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "./ExpenseForm";
import { useExpenses } from "@/context/expenses-context";
import type { Expense, ExpenseInput } from "@/lib/types";

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  editingExpense?: Expense;
}

export function ExpenseFormModal({ open, onClose, editingExpense }: ExpenseFormModalProps) {
  const { addExpense, updateExpense } = useExpenses();

  function handleSubmit(input: ExpenseInput) {
    if (editingExpense) {
      updateExpense(editingExpense.id, input);
    } else {
      addExpense(input);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editingExpense ? "Edit Expense" : "Add Expense"}>
      <ExpenseForm
        key={editingExpense?.id ?? "new"}
        initialExpense={editingExpense}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
