import type { ExportFormatDescriptor } from "./types";

/** Reserved by Windows and/or POSIX path syntax. */
const RESERVED = /[<>:"/\\|?*]/g;

/** Control characters, matched by code point so no escapes appear in source. */
function stripControlChars(input: string): string {
  let out = "";
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 32 && code !== 127) out += char;
  }
  return out;
}

/**
 * Normalise user input into something every OS will accept as a file name.
 * Hyphens, underscores and spaces are legal and deliberately preserved.
 * Returns "" when nothing usable remains, which the UI treats as invalid.
 */
export function sanitizeFilename(input: string): string {
  return stripControlChars(input)
    .replace(RESERVED, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .slice(0, 120)
    .trim();
}

export function isFilenameValid(input: string): boolean {
  return sanitizeFilename(input).length > 0;
}

export function suggestFilename(today: string): string {
  return `expenses-${today}`;
}

/** Join the sanitised base name with the format's extension, avoiding doubling. */
export function withExtension(base: string, format: ExportFormatDescriptor): string {
  const clean = sanitizeFilename(base);
  const suffix = `.${format.extension}`;
  return clean.toLowerCase().endsWith(suffix) ? clean : `${clean}${suffix}`;
}
