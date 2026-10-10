import axios from "axios";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("shreya-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type Permission = { view: boolean; create: boolean; edit: boolean; delete: boolean };
export type SessionUser = {
  id: string; name: string; email: string; role: string;
  permissions: Record<string, Permission>;
};
export type RecordRow = Record<string, unknown> & { id: string };

export function humanize(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if ("name" in value && typeof value.name === "string") return value.name;
    if ("firstName" in value && typeof value.firstName === "string") return `${value.firstName} ${"lastName" in value ? value.lastName : ""}`.trim();
    return JSON.stringify(value);
  }
  return String(value);
}

export function money(value: unknown): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

export function exportCsv(filename: string, rows: RecordRow[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const quote = (value: unknown) => `"${humanize(value).replaceAll('"', '""')}"`;
  const content = [headers.map(quote).join(","), ...rows.map((row) => headers.map((header) => quote(row[header])).join(","))].join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}
