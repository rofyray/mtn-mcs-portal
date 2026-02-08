/**
 * CSV generation utilities for admin reports.
 */

/** Escape a value for safe CSV output. */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Generate a full CSV string (with UTF-8 BOM for Excel compatibility). */
export function generateCsv(headers: string[], rows: string[][]): string {
  const bom = "\uFEFF";
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return bom + [headerLine, ...dataLines].join("\r\n");
}

/** Format a Date as YYYY-MM-DD HH:mm. */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
