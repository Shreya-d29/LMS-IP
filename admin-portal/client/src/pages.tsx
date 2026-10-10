import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, Printer, Sparkles } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, exportCsv, humanize, money, type RecordRow } from "./api";
import { useAuth } from "./auth";
import { modules, type ModuleSpec } from "./catalog";
import { Button, CsvImport, DataTable, LoadingState, Modal, PageHeader, RecordForm, Toast } from "./components";

type DashboardData = {
  students: number; teachers: number; attendanceToday: number; attendanceRate: number;
  feesCollected: number; feesBilled: number; invoicesPending: number;
  analytics: Array<{ month: string; enrollment: number; attendance: number; collection: number; performance: number }>;
  events: Array<{ id: string; title: string; startAt: string; location?: string | null }>;
  applications: Array<{ id: string; firstName: string; lastName: string; status: string; createdAt: string }>;
  payments: Array<{ id: string; receiptNo: string; amount: number; paidAt: string; invoice?: { student?: { firstName: string; lastName: string } } }>;
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get<DashboardData>("/dashboard").then(({ data: value }) => setData(value)).catch(() => setError("Dashboard data could not be loaded. Check the API connection and your access.")); }, []);
  if (error) return <div className="error-panel"><AlertCircle size={19} />{error}</div>;
  if (!data) return <LoadingState />;
  const collectedPercent = data.feesBilled ? Math.round((data.feesCollected / data.feesBilled) * 100) : 0;
  const cards = [
    { label: "Total students", value: data.students.toLocaleString("en-IN"), note: "Across active classes", icon: "♧", tone: "purple" },
    { label: "Teaching staff", value: data.teachers.toLocaleString("en-IN"), note: "Faculty members", icon: "✳", tone: "peach" },
    { label: "Attendance today", value: `${data.attendanceRate}%`, note: `${data.attendanceToday} present today`, icon: "✓", tone: "green" },
    { label: "Fees collected", value: money(data.feesCollected), note: `${data.invoicesPending} invoices pending`, icon: "₹", tone: "blue" }
  ];
  return <div className="dashboard-page">
    <PageHeader title="Good morning, Shreya" description="Here’s what’s happening at your school today.">
      <span className="date-chip">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span>
    </PageHeader>
    <div className="summary-grid">{cards.map((card) => <article className="summary-card" key={card.label}><div className="summary-top"><span>{card.label}</span><span className={`summary-icon ${card.tone}`}>{card.icon}</span></div><strong>{card.value}</strong><small>{card.note}</small></article>)}</div>
    <section className="insight-grid">
      <article className="panel enrollment-panel"><div className="panel-title"><div><span className="eyebrow">YOUR SCHOOL AT A GLANCE</span><h2>Fee collection</h2></div><span className="trend-badge"><Sparkles size={14} /> {collectedPercent}% collected</span></div>
        <div className="collection-overview"><span className="collection-total">{money(data.feesCollected)}</span><span className="muted">of {money(data.feesBilled)} billed</span></div>
        <div className="progress-track"><span style={{ width: `${Math.min(100, collectedPercent)}%` }} /></div>
        <div className="collection-legend"><span><i className="legend-dot violet" /> Collected <b>{money(data.feesCollected)}</b></span><span><i className="legend-dot gray" /> Remaining <b>{money(Math.max(0, data.feesBilled - data.feesCollected))}</b></span></div>
        <div className="insight-caption">Current school year · Fees across all classes</div>
      </article>
      <article className="panel events-panel"><div className="panel-title"><div><span className="eyebrow">MARK YOUR CALENDAR</span><h2>Upcoming events</h2></div><span className="panel-counter">{data.events.length} upcoming</span></div>
        {data.events.length ? <div className="event-list">{data.events.map((event) => <div className="event-row" key={event.id}><div className="event-date"><b>{new Date(event.startAt).toLocaleDateString("en-IN", { day: "2-digit" })}</b><span>{new Date(event.startAt).toLocaleDateString("en-IN", { month: "short" })}</span></div><div className="event-info"><strong>{event.title}</strong><span>{event.location || "School campus"}</span></div><span className="event-clock">{new Date(event.startAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span></div>)}</div> : <div className="compact-empty">No upcoming events yet</div>}
      </article>
    </section>
    <section className="chart-grid">
      <article className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">STUDENT INTAKE</span><h2>Enrollment trends</h2></div><span className="chart-legend"><i /> New students</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.analytics} margin={{ top: 12, right: 5, left: -24, bottom: 0 }}><defs><linearGradient id="enrollment-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9271d5" stopOpacity={0.25} /><stop offset="95%" stopColor="#9271d5" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9995a1", fontSize: 9 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#9995a1", fontSize: 9 }} /><Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", fontSize: 10, borderRadius: 8 }} /><Area type="monotone" dataKey="enrollment" stroke="#8464cc" strokeWidth={2} fill="url(#enrollment-fill)" /></AreaChart></ResponsiveContainer></div>
      </article>
      <article className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">SCHOOL WELLBEING</span><h2>Attendance & results</h2></div><span className="chart-legend"><i className="legend-blue" /> Attendance %</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.analytics} margin={{ top: 12, right: 3, left: -24, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9995a1", fontSize: 9 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#9995a1", fontSize: 9 }} /><Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", fontSize: 10, borderRadius: 8 }} /><Bar dataKey="attendance" fill="#87b797" radius={[4, 4, 0, 0]} maxBarSize={23} /></BarChart></ResponsiveContainer></div>
        <div className="exam-note">Average exam performance: <b>{data.analytics.at(-1)?.performance ?? 0}%</b></div>
      </article>
      <article className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">SCHOOL FINANCES</span><h2>Fee collection</h2></div><span className="chart-legend"><i className="legend-peach" /> Collected</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.analytics} margin={{ top: 12, right: 5, left: -12, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9995a1", fontSize: 9 }} /><YAxis tickFormatter={(value: number) => value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)} axisLine={false} tickLine={false} tick={{ fill: "#9995a1", fontSize: 9 }} /><Tooltip formatter={(value) => money(value)} contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", fontSize: 10, borderRadius: 8 }} /><Bar dataKey="collection" fill="#d5a073" radius={[4, 4, 0, 0]} maxBarSize={23} /></BarChart></ResponsiveContainer></div>
      </article>
    </section>
    <section className="bottom-grid"><article className="panel activity-panel"><div className="panel-title"><div><span className="eyebrow">LATEST TRANSACTIONS</span><h2>Recent fee payments</h2></div><a href="/payments">View all →</a></div>
      {data.payments.length ? <div className="activity-list">{data.payments.map((payment) => <div className="activity-row" key={payment.id}><span className="activity-avatar">{payment.invoice?.student?.firstName?.[0] ?? "S"}</span><span className="activity-name"><b>{payment.invoice?.student ? `${payment.invoice.student.firstName} ${payment.invoice.student.lastName}` : payment.receiptNo}</b><small>{new Date(payment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · Payment received</small></span><span className="activity-amount">+{money(payment.amount)}</span></div>)}</div> : <div className="compact-empty">Payments will appear here as they’re recorded</div>}
    </article><article className="panel applicants-panel"><div className="panel-title"><div><span className="eyebrow">NEW FACES</span><h2>Recent applicants</h2></div><a href="/admissions">View all →</a></div>
      {data.applications.length ? <div className="applicant-list">{data.applications.map((applicant) => <div className="applicant-row" key={applicant.id}><div><b>{applicant.firstName} {applicant.lastName}</b><small>Applied {new Date(applicant.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></div><span className={`status-pill status-${applicant.status.toLowerCase().replaceAll("_", "-")}`}>{humanize(applicant.status)}</span></div>)}</div> : <div className="compact-empty">No applications have been submitted yet</div>}
    </article></section>
  </div>;
}

export function ModulePage({ module }: { module: ModuleSpec }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<RecordRow | null | "create">(null);
  const permission = user?.permissions[module.resource] ?? { view: user?.role === "SUPER_ADMIN", create: false, edit: false, delete: false };
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get<RecordRow[]>(`/${module.resource}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (caught) {
      setError(caught instanceof Error && "response" in caught ? String((caught as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Could not load records.") : "Could not connect to the server.");
    } finally { setLoading(false); }
  }, [module.resource]);
  useEffect(() => { void load(); }, [load]);

  async function save(values: Record<string, unknown>) {
    try {
      if (editing === "create") await api.post(`/${module.resource}`, values);
      else if (editing) await api.patch(`/${module.resource}/${editing.id}`, values);
      setEditing(null); setToast(editing === "create" ? "Record created successfully." : "Changes saved successfully."); await load();
    } catch (caught) {
      const response = caught as { response?: { data?: { error?: string; details?: { fieldErrors?: Record<string, string[]> } } } };
      const message = response.response?.data?.error ?? (caught instanceof Error ? caught.message : "Unable to save record.");
      throw new Error(message);
    }
  }
  async function remove(row: RecordRow) {
    if (!window.confirm(`Delete ${humanize(row[module.columns[0]])}? This action cannot be undone.`)) return;
    try { await api.delete(`/${module.resource}/${row.id}`); setToast("Record deleted."); await load(); }
    catch (caught) { setToast((caught as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Could not delete the record."); }
  }
  async function enroll(row: RecordRow) {
    try {
      await api.post(`/applications/${row.id}/enroll`);
      setToast("Applicant enrolled as a student."); await load();
    } catch (caught) {
      setToast((caught as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Could not enroll applicant.");
    }
  }
  const rowsForCsv = useMemo(() => rows.map((row) => Object.fromEntries(module.columns.map((column) => [column, humanize(row[column])])) as RecordRow), [rows, module.columns]);
  if (loading) return <LoadingState />;
  return <div className="module-page">
    <PageHeader title={module.label} description={module.description}>
      {module.fields.length > 0 && <><CsvImport resource={module.resource} onImported={() => { setToast("CSV import complete."); void load(); }} /><Button variant="secondary" onClick={() => window.print()}><Printer size={15} /> Print</Button>{permission.create && <Button onClick={() => setEditing("create")}><Plus size={16} /> Add {module.label.replace(/s$/, "")}</Button>}</>}
    </PageHeader>
    {error && <div className="error-panel"><AlertCircle size={18} />{error}<Button variant="ghost" onClick={() => void load()}>Try again</Button></div>}
    {module.resource === "roles" && <RolesOverview />}
    {module.resource === "settings" && <div className="settings-hint"><Sparkles size={17} /><span>School profile and operating preferences are stored as structured JSON settings. Use <b>school-profile</b> for institution identity and contact details.</span></div>}
    {module.resource === "marks" && <div className="settings-hint"><Sparkles size={17} /><span>Enter scores against a student and exam. Totals and percentages are calculated in the results reporting view.</span></div>}
    {module.resource === "timetable" && <div className="settings-hint"><AlertCircle size={17} /><span>Teacher and room double-bookings are blocked when schedule validation is enabled on the API.</span></div>}
    {module.resource === "invoices" && <div className="settings-hint"><Sparkles size={17} /><span>Outstanding balance: <b>{money(rows.reduce((sum, row) => sum + Number(row.amount ?? 0) - Number(row.paidAmount ?? 0), 0))}</b>. Invoice payments update status automatically.</span></div>}
    {loading ? <LoadingState /> : <DataTable rows={rows} columns={module.columns} canEdit={permission.edit} canDelete={permission.delete} onEdit={(row) => setEditing(row)} onDelete={(row) => void remove(row)} onEnroll={module.resource === "applications" && permission.edit && (user?.role === "SUPER_ADMIN" || user?.permissions.students?.create) ? (row) => void enroll(row) : undefined} onExport={() => exportCsv(`${module.resource}.csv`, rowsForCsv)} />}
    {editing !== null && <Modal title={editing === "create" ? `Add ${module.label.replace(/s$/, "")}` : `Edit ${module.label.replace(/s$/, "")}`} onClose={() => setEditing(null)}><RecordForm fields={module.fields} initial={editing === "create" ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} /></Modal>}
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
  </div>;
}

function RolesOverview() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? {};
  return <section className="panel permission-panel"><div className="panel-title"><div><span className="eyebrow">ACCESS CONTROL</span><h2>Your module permissions</h2></div></div><div className="table-scroll"><table><thead><tr><th>Module</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th></tr></thead><tbody>{modules.map((module) => <tr key={module.resource}><td>{module.label}</td>{(["view", "create", "edit", "delete"] as const).map((action) => <td key={action}><span className={`permission-check ${user?.role === "SUPER_ADMIN" || permissions[module.resource]?.[action] ? "allowed" : ""}`}>{user?.role === "SUPER_ADMIN" || permissions[module.resource]?.[action] ? "✓" : "—"}</span></td>)}</tr>)}</tbody></table></div><p className="muted">Current account role: <b>{user?.role.replaceAll("_", " ")}</b>. Permission updates require an administrator account.</p></section>;
}
