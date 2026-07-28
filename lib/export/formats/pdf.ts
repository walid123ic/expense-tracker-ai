import { formatCurrency, formatDateDisplay } from "@/lib/format";
import { describeRange } from "../selection";
import { PAGE_HEIGHT, PAGE_WIDTH, PdfPage, renderPdf, truncateToWidth } from "../pdf-writer";
import type { ExportFormatDescriptor, ExportOptions, ExportSelection } from "../types";

const MARGIN = 48;
const BOTTOM_LIMIT = 64;
const ROW_HEIGHT = 16;
const BODY_SIZE = 9;

const COL_DATE = MARGIN;
const COL_CATEGORY = 132;
const COL_AMOUNT_RIGHT = 320;
const COL_DESCRIPTION = 340;
const DESCRIPTION_WIDTH = PAGE_WIDTH - MARGIN - COL_DESCRIPTION;

function drawTitleBlock(page: PdfPage, selection: ExportSelection, options: ExportOptions): number {
  let y = PAGE_HEIGHT - MARGIN - 8;

  page.text(MARGIN, y, "Expense Report", { size: 18, weight: "bold" });
  y -= 20;

  page.text(MARGIN, y, `Generated ${formatDateDisplay(new Date().toISOString().slice(0, 10))}`, {
    size: 9,
    gray: 0.45,
  });
  y -= 24;

  // Summary band
  page.rect(MARGIN, y - 44, PAGE_WIDTH - MARGIN * 2, 52, 0.96);

  page.text(MARGIN + 12, y - 8, "RECORDS", { size: 7, weight: "bold", gray: 0.45 });
  page.text(MARGIN + 12, y - 26, String(selection.matched), { size: 15, weight: "bold" });

  page.text(MARGIN + 130, y - 8, "TOTAL", { size: 7, weight: "bold", gray: 0.45 });
  page.text(MARGIN + 130, y - 26, formatCurrency(selection.totalAmount), { size: 15, weight: "bold" });

  page.text(MARGIN + 290, y - 8, "DATE RANGE", { size: 7, weight: "bold", gray: 0.45 });
  page.text(MARGIN + 290, y - 24, describeRange(options.range), { size: 9 });
  page.text(MARGIN + 290, y - 36, `${options.categories.length} categories selected`, {
    size: 8,
    gray: 0.45,
  });

  return y - 68;
}

function drawTableHeader(page: PdfPage, y: number): number {
  page.text(COL_DATE, y, "DATE", { size: 7, weight: "bold", gray: 0.4 });
  page.text(COL_CATEGORY, y, "CATEGORY", { size: 7, weight: "bold", gray: 0.4 });
  page.textRight(COL_AMOUNT_RIGHT, y, "AMOUNT", { size: 7, weight: "bold", gray: 0.4 });
  page.text(COL_DESCRIPTION, y, "DESCRIPTION", { size: 7, weight: "bold", gray: 0.4 });

  page.line(MARGIN, y - 6, PAGE_WIDTH - MARGIN, y - 6, 0.75);
  return y - 6 - ROW_HEIGHT;
}

export const pdfFormat: ExportFormatDescriptor = {
  id: "pdf",
  label: "PDF",
  extension: "pdf",
  mimeType: "application/pdf",
  description: "Paginated report with totals. For sharing and filing.",

  build(selection: ExportSelection, options: ExportOptions): Blob {
    const pages: PdfPage[] = [];

    let page = new PdfPage();
    let y = drawTitleBlock(page, selection, options);
    y = drawTableHeader(page, y);
    pages.push(page);

    if (selection.rows.length === 0) {
      page.text(MARGIN, y, "No records matched the selected filters.", { size: 9, gray: 0.45 });
    }

    selection.rows.forEach((expense, index) => {
      if (y < BOTTOM_LIMIT) {
        page = new PdfPage();
        pages.push(page);
        y = drawTableHeader(page, PAGE_HEIGHT - MARGIN);
      }

      if (index % 2 === 1) {
        page.rect(MARGIN, y - 4, PAGE_WIDTH - MARGIN * 2, ROW_HEIGHT - 3, 0.972);
      }

      page.text(COL_DATE, y, formatDateDisplay(expense.date), { size: BODY_SIZE });
      page.text(COL_CATEGORY, y, expense.category, { size: BODY_SIZE });
      page.textRight(COL_AMOUNT_RIGHT, y, formatCurrency(expense.amount), { size: BODY_SIZE });
      page.text(
        COL_DESCRIPTION,
        y,
        truncateToWidth(expense.description, BODY_SIZE, DESCRIPTION_WIDTH),
        { size: BODY_SIZE }
      );

      y -= ROW_HEIGHT;
    });

    // Totals rule under the final row.
    if (selection.rows.length > 0) {
      page.line(MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8, 0.75);
      page.text(COL_CATEGORY, y - 6, "TOTAL", { size: 8, weight: "bold" });
      page.textRight(COL_AMOUNT_RIGHT, y - 6, formatCurrency(selection.totalAmount), {
        size: 9,
        weight: "bold",
      });
    }

    // Footers are added last, once the page count is known.
    pages.forEach((p, index) => {
      p.line(MARGIN, 52, PAGE_WIDTH - MARGIN, 52, 0.88);
      p.text(MARGIN, 38, "Clarity expense export", { size: 8, gray: 0.5 });
      p.textRight(PAGE_WIDTH - MARGIN, 38, `Page ${index + 1} of ${pages.length}`, {
        size: 8,
        gray: 0.5,
      });
    });

    return renderPdf(pages, { title: `Expense Report (${selection.matched} records)` });
  },
};
