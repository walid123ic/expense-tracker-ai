/**
 * A deliberately small PDF 1.4 writer -- enough for paginated tabular reports,
 * with no third-party dependency.
 *
 * Scope: Letter pages, the two base-14 Helvetica faces (which every reader has
 * built in, so no font embedding), filled rectangles and straight lines.
 * Everything is written as ASCII, which keeps string length equal to byte
 * length -- the xref table depends on that identity being exact.
 */

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;

export type FontWeight = "regular" | "bold";

interface TextStyle {
  size?: number;
  weight?: FontWeight;
  /** 0 = black, 1 = white. */
  gray?: number;
}

/** Helvetica advance widths (per 1000 units) for the characters we actually emit. */
const WIDTHS: Record<string, number> = {
  " ": 278, ".": 278, ",": 278, ":": 278, ";": 278, "'": 191, "!": 278, "|": 260,
  "(": 333, ")": 333, "-": 333, "/": 278, "$": 556, "%": 889, "#": 556, "&": 667,
};

function charWidth(char: string): number {
  const known = WIDTHS[char];
  if (known !== undefined) return known;
  if (char >= "0" && char <= "9") return 556;
  if (char >= "A" && char <= "Z") return 667;
  if (char >= "a" && char <= "z") return 528;
  return 500;
}

export function measureText(text: string, size: number): number {
  let total = 0;
  for (const char of text) total += charWidth(char);
  return (total / 1000) * size;
}

/** Trim to a pixel width, appending an ellipsis when anything was removed. */
export function truncateToWidth(text: string, size: number, maxWidth: number): string {
  if (measureText(text, size) <= maxWidth) return text;
  const ellipsis = "...";
  let result = "";
  for (const char of text) {
    if (measureText(result + char + ellipsis, size) > maxWidth) break;
    result += char;
  }
  return `${result.trimEnd()}${ellipsis}`;
}

/**
 * PDF literal strings are delimited by parentheses, so those and the escape
 * character must be escaped. Non-ASCII is replaced rather than encoded: these
 * fonts are WinAnsi and the byte-offset arithmetic assumes 1 byte per char.
 */
/** Curly quotes, dashes and ellipses have sensible ASCII equivalents. */
const TRANSLITERATIONS: Array<[RegExp, string]> = [
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[–—−]/g, "-"],
  [/…/g, "..."],
  [/ /g, " "],
];

function escapeText(text: string): string {
  let result = text.replace(/[\r\n\t]+/g, " ");
  for (const [pattern, replacement] of TRANSLITERATIONS) {
    result = result.replace(pattern, replacement);
  }
  return result
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/** PDF date syntax: D:YYYYMMDDHHmmSS. */
function pdfDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `D:${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/** Accumulates content-stream operators for a single page. */
export class PdfPage {
  private ops: string[] = [];

  text(x: number, y: number, content: string, style: TextStyle = {}): this {
    const { size = 10, weight = "regular", gray = 0 } = style;
    const font = weight === "bold" ? "/F2" : "/F1";
    this.ops.push(
      `BT ${font} ${size} Tf ${gray} ${gray} ${gray} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapeText(content)}) Tj ET`
    );
    return this;
  }

  textRight(rightEdge: number, y: number, content: string, style: TextStyle = {}): this {
    const width = measureText(content, style.size ?? 10);
    return this.text(rightEdge - width, y, content, style);
  }

  rect(x: number, y: number, width: number, height: number, gray: number): this {
    this.ops.push(
      `${gray} ${gray} ${gray} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`
    );
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, gray = 0.8, width = 0.7): this {
    this.ops.push(
      `${gray} ${gray} ${gray} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
    return this;
  }

  toContentStream(): string {
    return this.ops.join("\n");
  }
}

/**
 * Serialise pages into a complete PDF file.
 *
 * Object numbering: 1 catalog, 2 page tree, 3/4 fonts, then two objects per
 * page (the page dictionary followed by its content stream).
 */
export function renderPdf(pages: PdfPage[], meta: { title?: string } = {}): Blob {
  const objects: string[] = [];
  const INFO_OBJECT = 5;
  const FIRST_PAGE_OBJECT = 6;

  const kids = pages.map((_, i) => `${FIRST_PAGE_OBJECT + i * 2} 0 R`).join(" ");

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  objects[INFO_OBJECT] =
    `<< /Title (${escapeText(meta.title ?? "Expense Report")}) /Producer (Clarity) ` +
    `/Creator (Clarity) /CreationDate (${pdfDate(new Date())}) >>`;

  pages.forEach((page, index) => {
    const pageObject = FIRST_PAGE_OBJECT + index * 2;
    const contentObject = pageObject + 1;
    const content = page.toContentStream();

    objects[pageObject] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  let file = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (let i = 1; i < objects.length; i++) {
    offsets[i] = file.length;
    file += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  // Cross-reference table: entries are exactly 20 bytes each, including the
  // trailing space before the newline. Readers seek by these offsets.
  const xrefOffset = file.length;
  file += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    file += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  file += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${INFO_OBJECT} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([file], { type: "application/pdf" });
}
