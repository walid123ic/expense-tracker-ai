import type { ExportFormatDescriptor, ExportOptions, ExportSelection } from "../types";

/**
 * A machine-readable envelope: the filters that produced the file travel with
 * the data, so an export is reproducible from the file alone.
 */
export const jsonFormat: ExportFormatDescriptor = {
  id: "json",
  label: "JSON",
  extension: "json",
  mimeType: "application/json",
  description: "Structured records with filter metadata. For scripts and APIs.",

  build(selection: ExportSelection, options: ExportOptions): Blob {
    const payload = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      filters: {
        dateFrom: options.range.from || null,
        dateTo: options.range.to || null,
        categories: options.categories,
      },
      summary: {
        recordCount: selection.matched,
        totalRecordsAvailable: selection.sourceTotal,
        totalAmount: selection.totalAmount,
        currency: "USD",
        earliestDate: selection.earliest,
        latestDate: selection.latest,
        byCategory: selection.perCategory,
      },
      records: selection.rows.map((expense) => ({
        id: expense.id,
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })),
    };

    return new Blob([JSON.stringify(payload, null, 2)], { type: jsonFormat.mimeType });
  },
};
