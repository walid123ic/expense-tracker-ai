import type { Category, Expense } from "@/lib/types";

export type ExportFormatId = "csv" | "json" | "pdf";

/** Empty string on either end means "unbounded". */
export interface DateRange {
  from: string;
  to: string;
}

export interface ExportOptions {
  format: ExportFormatId;
  range: DateRange;
  categories: Category[];
  /** Base name only, without extension. */
  filename: string;
}

/**
 * The resolved result of applying ExportOptions to a set of expenses:
 * the rows that will be written plus everything the UI needs to describe them.
 */
export interface ExportSelection {
  rows: Expense[];
  matched: number;
  sourceTotal: number;
  totalAmount: number;
  earliest: string | null;
  latest: string | null;
  perCategory: Array<{ category: Category; count: number; amount: number }>;
}

/**
 * A format is a self-contained strategy: it knows its own extension, MIME type
 * and how to turn a selection into bytes. Adding a format means adding one
 * module and one registry entry -- no changes to the drawer or the job runner.
 */
export interface ExportFormatDescriptor {
  id: ExportFormatId;
  label: string;
  extension: string;
  mimeType: string;
  /** Shown beside the format in the picker. */
  description: string;
  build: (selection: ExportSelection, options: ExportOptions) => Blob | Promise<Blob>;
}
