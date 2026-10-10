import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  Activity, ArrowRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays, CalendarHeart, CalendarOff, ChevronDown,
  ClipboardCheck, Clock3, CreditCard, FileCheck2, GraduationCap, History, LayoutDashboard, LogOut, Menu,
  Megaphone, Moon, PanelsTopLeft, ReceiptText, School, Search, Settings2, ShieldCheck, Sun, UserCheck, UsersRound,
  WalletCards, Award, PanelLeftClose
} from "lucide-react";
import { AuthProvider, RequireAuth, RequirePermission, useAuth } from "./auth";
import { modules, moduleByPath } from "./catalog";
import { Button, PageHeader } from "./components";
import { Dashboard, ModulePage } from "./pages";

const iconMap = {
  GraduationCap, BriefcaseBusiness, ClipboardCheck, School, PanelsTopLeft, BookOpen, CalendarDays, CalendarRange: CalendarDays,
  Clock3, UserCheck, CalendarOff, FileCheck2, Award, WalletCards, ReceiptText, CreditCard, CalendarHeart, Megaphone,
  UsersRound, ShieldCheck, History, Settings2
};

function Shell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("shreya-theme") === "dark");
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("shreya-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  const canSee = (resource: string) => user?.role === "SUPER_ADMIN" || user?.permissions[resource]?.view;
  const groups = [...new Set(modules.map((item) => item.group))];
  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <Link to="/" className="brand"><span className="brand-mark">s</span><span className="brand-word">shreya<span>.</span><small>ADMIN PORTAL</small></span></Link>
      <div className="school-switcher"><span className="school-avatar"><School size={18} /></span><span className="school-label"><b>Shreya International</b><small>School workspace</small></span><ChevronDown size={15} /></div>
      <nav className="sidebar-nav"><Link to="/" className={`nav-item ${location.pathname === "/" ? "active" : ""}`}><LayoutDashboard size={18} /><span>Overview</span></Link>
        {canSee("reports") && <Link to="/reports" className={`nav-item ${location.pathname === "/reports" ? "active" : ""}`}><Activity size={17} /><span>Reports & exports</span></Link>}
        {groups.map((group) => <div className="nav-group" key={group}><span className="nav-caption">{group}</span>{modules.filter((item) => item.group === group && canSee(item.resource)).map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Activity;
          return <Link key={item.resource} to={item.path} className={`nav-item ${location.pathname === item.path ? "active" : ""}`}><Icon size={17} /><span>{item.label}</span>{item.resource === "applications" && <span className="nav-badge">4</span>}</Link>;
        })}</div>)}
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-spark">✳</span><b>Need a hand?</b><small>Visit the help center for tips.</small><button onClick={() => window.open("mailto:support@shreya.edu")}>Get support <ArrowRight size={13} /></button></div><button className="user-mini" onClick={() => { signOut(); navigate("/login"); }}><span className="user-avatar">S</span><span><b>{user?.name ?? "Administrator"}</b><small>{user?.role.replaceAll("_", " ")}</small></span><LogOut size={16} /></button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><button className="icon-button collapse-toggle" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}><PanelLeftClose size={19} /></button><span className="breadcrumb">Workspace <span>/</span> <b>{location.pathname === "/" ? "Overview" : moduleByPath[location.pathname]?.label ?? "Overview"}</b></span></div><div className="topbar-actions"><button className="global-search" onClick={() => navigate("/students")}><Search size={16} /><span>Search anything…</span><kbd>⌘ K</kbd></button><button className="icon-button theme-toggle" aria-label={`Switch to ${dark ? "light" : "dark"} mode`} onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><span className="topbar-avatar">S</span></div></header>
      <div className="page-content"><Outlet /></div>
      <footer className="app-footer"><span>© 2026 Shreya International School</span><span>Thoughtfully managing your school <span className="footer-heart">♥</span></span></footer>
    </main>
  </div>;
}

function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@shreya.edu");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      await signIn(email, password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
      navigate(from, { replace: true });
    } catch (caught) {
      if (isAxiosError(caught) && !caught.response) {
        setError("The Shreya API is not running. Start PostgreSQL, then run “npm run dev” from the project folder.");
      } else if (isAxiosError<{ error?: string }>(caught)) {
        setError(caught.response?.data?.error ?? "We couldn’t sign you in. Check your email and password and try again.");
      } else {
        setError("We couldn’t sign you in. Check your email and password and try again.");
      }
    }
    finally { setLoading(false); }
  }
  return <main className="login-page"><div className="login-art"><div className="login-art-brand"><span className="brand-mark">s</span><span>shreya<span>.</span></span></div><div className="login-quote"><span className="eyebrow">A CLEARER VIEW OF YOUR SCHOOL</span><h1>Good schools<br />grow <i>together.</i></h1><p>Every student, every story, every step forward — all in one thoughtful space.</p><div className="login-art-decoration"><div /><div /><div /></div></div><span className="login-footnote">Made for the people who make a difference.</span></div>
    <section className="login-form-area"><form className="login-form" onSubmit={(event) => void submit(event)}><span className="login-form-icon"><School size={20} /></span><span className="eyebrow">WELCOME BACK</span><h2>Sign in to Shreya</h2><p>Your school workspace is just a few clicks away.</p>
      <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      {error && <div className="form-error" role="alert">{error}</div>}<Button type="submit" disabled={loading} className="login-submit">{loading ? "Signing in…" : "Sign in"} <ArrowRight size={16} /></Button><span className="login-demo">Demo account is pre-filled. Change the password after first sign-in.</span></form><span className="login-copyright">© 2026 Shreya International School</span></section>
  </main>;
}

function ReportsPage() {
  return <div className="module-page"><PageHeader title="Reports & exports" description="Prepare printable school reports and export data for your teams." /><section className="report-grid">{[
    { title: "Attendance report", detail: "Review student and staff attendance by class and date range.", to: "/attendance", icon: ClipboardCheck },
    { title: "Fee collection report", detail: "Track fee collection, invoices, concessions, and defaulters.", to: "/invoices", icon: WalletCards },
    { title: "Examination results", detail: "Review marks, grades, and student performance.", to: "/marks", icon: Award },
    { title: "Enrollment report", detail: "Review student totals and application progress.", to: "/admissions", icon: GraduationCap }
  ].map((item) => <Link className="report-card" to={item.to} key={item.title}><span className="report-icon"><item.icon size={19} /></span><b>{item.title}</b><p>{item.detail}</p><span className="report-link">Open report <ArrowRight size={14} /></span></Link>)}</section></div>;
}

function AppRoutes() {
  return <Routes><Route path="/login" element={<Login />} /><Route element={<RequireAuth><Shell /></RequireAuth>}><Route path="/" element={<RequirePermission module="dashboard"><Dashboard /></RequirePermission>} />{modules.map((module) => <Route key={module.path} path={module.path} element={<RequirePermission module={module.resource}><ModulePage module={module} /></RequirePermission>} />)}<Route path="/reports" element={<RequirePermission module="dashboard"><ReportsPage /></RequirePermission>} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>;
}
