import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Search, X, ChevronLeft, ChevronRight, Plus, Download, Upload, LoaderCircle } from "lucide-react";
import { api, humanize, type RecordRow } from "./api";
import type { FieldSpec } from "./catalog";

export function Button({ children, onClick, variant = "primary", type = "button", disabled = false, className = "" }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick} type={type} disabled={disabled}>{children}</button>;
}

export function PageHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div><div className="header-actions">{children}</div></div>;
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 3800); return () => window.clearTimeout(timer); }, [message, onClose]);
  return <div role="status" className="toast"><span>{message}</span><button aria-label="Dismiss notification" onClick={onClose}><X size={16} /></button></div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-header"><div><span className="eyebrow">SHREYA • MANAGEMENT</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={19} /></button></header>
      {children}
    </section>
  </div>;
}

export function RecordForm({ fields, initial, onSave, onCancel }: {
  fields: FieldSpec[]; initial?: RecordRow; onSave: (values: Record<string, unknown>) => Promise<void>; onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true);
    const form = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = String(form.get(field.key) ?? "").trim();
      if (initial && field.key === "password" && !raw) continue;
      if (!raw) { if (field.required) { setError(`${field.label} is required.`); setSaving(false); return; } continue; }
      if (field.type === "number") {
        const numberValue = Number(raw);
        if (!Number.isFinite(numberValue)) { setError(`${field.label} must be a valid number.`); setSaving(false); return; }
        values[field.key] = numberValue;
      } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        setError(`Enter a valid ${field.label.toLowerCase()}.`); setSaving(false); return;
      } else if (field.key === "active" || field.key === "published") {
        values[field.key] = raw.toLowerCase() === "true" || raw === "1";
      } else if (field.type === "textarea" && field.key === "value") {
        try { values[field.key] = JSON.parse(raw) as unknown; }
        catch { setError("Enter a valid JSON value."); setSaving(false); return; }
      } else values[field.key] = raw;
    }
    try { await onSave(values); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save this record."); }
    finally { setSaving(false); }
  }
  return <form onSubmit={(event) => void submit(event)} className="record-form">
    <div className="form-grid">
      {fields.map((field) => {
        const initialValue = initial?.[field.key];
        const value = initialValue && typeof initialValue === "object" ? "" : initialValue === undefined ? "" : String(initialValue).slice(0, 10);
        return <label className={field.type === "textarea" ? "form-span" : ""} key={field.key}>
          <span>{field.label}{field.required && <b> *</b>}</span>
          {field.type === "textarea" ?
            <textarea name={field.key} defaultValue={field.key === "value" && initialValue !== undefined ? JSON.stringify(initialValue) : value} placeholder={field.placeholder} required={field.required} rows={3} /> :
            field.type === "select" ?
              <select name={field.key} defaultValue={value} required={field.required}><option value="">Select…</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> :
              <input name={field.key} type={field.type ?? "text"} defaultValue={value} placeholder={field.placeholder} required={field.required} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? "any" : undefined} />
          }
        </label>;
      })}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <footer className="form-footer"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16} /> Saving…</> : "Save changes"}</Button></footer>
  </form>;
}

export function DataTable({ rows, columns, onEdit, onDelete, onExport, onEnroll, canEdit, canDelete }: {
  rows: RecordRow[]; columns: string[]; onEdit?: (row: RecordRow) => void; onDelete?: (row: RecordRow) => void;
  onExport?: () => void; onEnroll?: (row: RecordRow) => void; canEdit: boolean; canDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const filtered = rows.filter((row) => columns.some((column) => humanize(row[column]).toLowerCase().includes(query.toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  return <section className="table-card">
    <div className="table-toolbar"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search records…" /></label><div className="table-tools"><span>{filtered.length} records</span>{onExport && <Button variant="secondary" onClick={onExport}><Download size={15} /> Export</Button>}</div></div>
    {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon"><Search size={21} /></div><strong>{rows.length ? "No matching records" : "Nothing here yet"}</strong><span>{rows.length ? "Try another search term." : "Create your first record to get started."}</span></div> :
      <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</th>)}{(canEdit || canDelete || onEnroll) && <th className="actions-heading">Actions</th>}</tr></thead>
        <tbody>{pageRows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column}>
          {column === "status" || column === "active" || column === "published" ? <span className={`status-pill status-${humanize(row[column]).toLowerCase().replaceAll("_", "-")}`}>{humanize(row[column])}</span> :
            <span className="cell-value" title={humanize(row[column])}>{humanize(row[column])}</span>}
        </td>)}{(canEdit || canDelete || onEnroll) && <td className="row-actions">{onEnroll && row.status === "ACCEPTED" && <button onClick={() => onEnroll(row)}>Enroll student</button>}{canEdit && onEdit && <button onClick={() => onEdit(row)}>Edit</button>}{canDelete && onDelete && <button className="delete-action" onClick={() => onDelete(row)}>Delete</button>}</td>}</tr>)}</tbody></table></div>}
    <div className="table-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><button aria-label="Previous page" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}><ChevronLeft size={17} /></button><span className="page-number">{page} / {pageCount}</span><button aria-label="Next page" onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page >= pageCount}><ChevronRight size={17} /></button></div></div>
  </section>;
}

export function LoadingState() { return <div className="loading-state"><span className="spinner" /><span>Loading your records…</span></div>; }
export function EmptyAction({ onClick, label }: { onClick: () => void; label: string }) { return <Button onClick={onClick}><Plus size={16} /> {label}</Button>; }
export function CsvImport({ resource, onImported }: { resource: string; onImported: () => void }) {
  const [error, setError] = useState("");
  async function importFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const [head, ...lines] = text.split(/\r?\n/).filter(Boolean);
      if (!head) throw new Error("The CSV file is empty.");
      const keys = head.split(",").map((key) => key.replace(/^"|"$/g, "").trim());
      const parse = (line: string) => line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)?.map((cell) => cell.replace(/,$/, "").replace(/^"|"$/g, "").replaceAll('""', '"')) ?? [];
      const parsed = lines.map((line) => parse(line));
      for (const values of parsed) {
        const record = Object.fromEntries(keys.map((key, index) => {
          const value = values[index] ?? "";
          if (["grade", "capacity", "dayOfWeek", "maxMarks", "score", "amount", "paidAmount"].includes(key) && value !== "") return [key, Number(value)];
          if (["active", "published"].includes(key) && value !== "") return [key, value.toLowerCase() === "true" || value === "1"];
          return [key, value];
        }));
        await api.post(`/${resource}`, record);
      }
      onImported();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "CSV import failed."); }
  }
  return <label className="button button-secondary file-button"><Upload size={15} /> Import CSV<input type="file" accept=".csv,text/csv" hidden onChange={(event) => void importFile(event.target.files?.[0])} />{error && <span className="import-error">{error}</span>}</label>;
}
