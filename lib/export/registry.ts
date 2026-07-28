import { csvFormat } from "./formats/csv";
import { jsonFormat } from "./formats/json";
import { pdfFormat } from "./formats/pdf";
import type { ExportFormatDescriptor, ExportFormatId } from "./types";

export const EXPORT_FORMATS: ExportFormatDescriptor[] = [csvFormat, jsonFormat, pdfFormat];

const BY_ID = new Map<ExportFormatId, ExportFormatDescriptor>(
  EXPORT_FORMATS.map((format) => [format.id, format])
);

export function getFormat(id: ExportFormatId): ExportFormatDescriptor {
  const format = BY_ID.get(id);
  if (!format) throw new Error(`Unknown export format: ${id}`);
  return format;
}
