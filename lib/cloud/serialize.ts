import type { TemplateResult } from "./types";

function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Templates are already tabular, so serialisation is the same for all of them. */
export function templateToCsv(result: TemplateResult): string {
  const header = result.columns.map((column) => escapeCsvField(column.label)).join(",");
  const rows = result.rows.map((row) =>
    result.columns.map((column) => escapeCsvField(row[column.key] ?? "")).join(",")
  );
  return [header, ...rows].join("\r\n");
}

export function estimateBytes(result: TemplateResult): number {
  return new Blob([templateToCsv(result)]).size;
}

export function suggestFilename(templateId: string, today: string): string {
  return `${templateId}-${today}.csv`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
