import { formatDateDisplay } from "@/lib/format";
import type { ExportFormatDescriptor, ExportSelection } from "../types";

const COLUMNS = ["Date", "Date (display)", "Category", "Amount", "Description"] as const;

/** RFC 4180: quote when the field contains a delimiter, quote or line break; escape quotes by doubling. */
function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toRow(fields: string[]): string {
  return fields.map(escapeField).join(",");
}

export const csvFormat: ExportFormatDescriptor = {
  id: "csv",
  label: "CSV",
  extension: "csv",
  mimeType: "text/csv;charset=utf-8",
  description: "Spreadsheet-ready. Opens in Excel, Numbers or Sheets.",

  build(selection: ExportSelection): Blob {
    const lines = [toRow([...COLUMNS])];

    for (const expense of selection.rows) {
      lines.push(
        toRow([
          expense.date,
          formatDateDisplay(expense.date),
          expense.category,
          expense.amount.toFixed(2),
          expense.description,
        ])
      );
    }

    // CRLF per spec; BOM so Excel detects UTF-8 instead of mangling accents.
    const body = `﻿${lines.join("\r\n")}\r\n`;
    return new Blob([body], { type: csvFormat.mimeType });
  },
};
