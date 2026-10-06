/**
 * Minimal, dependency-free CSV writer with formula-injection escaping
 * (OWASP CSV Injection guidance): any field whose first character is one
 * of = + - @, or a tab/CR, is prefixed with a leading apostrophe so
 * spreadsheet apps never interpret it as a formula. Every field is also
 * quoted, with internal quotes doubled, so commas/newlines in lead-supplied
 * text (names, cities) can't break the row structure.
 */
const DANGEROUS_LEADING_CHARS = ["=", "+", "-", "@", "\t", "\r"];

export function escapeCsvField(value: unknown): string {
  let str = value === null || value === undefined ? "" : String(value);
  if (DANGEROUS_LEADING_CHARS.some((c) => str.startsWith(c))) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","));
  }
  // CRLF line endings for maximum spreadsheet-app compatibility.
  return lines.join("\r\n") + "\r\n";
}
