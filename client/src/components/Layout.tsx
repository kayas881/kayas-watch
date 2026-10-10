import { Activity, ChevronDown, Globe, LayoutDashboard, LogOut, Menu, MonitorCog, Search, Settings, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge } from "./ui";

const nav = [{ to: "/", label: "Dashboard", icon: LayoutDashboard }, { to: "/clients", label: "Clients", icon: Users }, { to: "/websites", label: "Websites", icon: Globe }, { to: "/monitors", label: "Monitors", icon: Activity }, { to: "/settings", label: "Settings", icon: Settings }];
export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [quickNav, setQuickNav] = useState(""); const navigate = useNavigate(); const location = useLocation();
  const goToPage = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const query = quickNav.trim().toLowerCase(); if (!query) return; const match = nav.find(item => item.label.toLowerCase().startsWith(query)); if (match) { navigate(match.to); setQuickNav(""); } };
  const brand = <div className="brand-lockup"><div className="brand-mark"><Activity aria-hidden="true" /></div><div><strong>Saral Watch</strong><span>By Saral Infosoft</span></div></div>;
  const sidebar = <><nav className="sidebar-nav" aria-label="Main navigation">{nav.map(item => <NavLink onClick={() => setOpen(false)} end={item.to === "/"} key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}><item.icon aria-hidden="true" /><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-pulse"><MonitorCog aria-hidden="true" /><p>Monitoring made clear</p><span>Live availability and security signals for every client website.</span></div></>;
  return <div className="app-shell">
    <aside className="sidebar sidebar-desktop"><div className="sidebar-brand">{brand}</div>{sidebar}</aside>
    <div className="app-workspace">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu" type="button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu /></button><form className="page-search" onSubmit={goToPage}><Search aria-hidden="true" /><input aria-label="Quick navigation" value={quickNav} onChange={event => setQuickNav(event.target.value)} placeholder="Go to a page…" /><kbd>↵</kbd></form></div>
        <div className="profile-wrap"><button className="profile-trigger" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen(value => !value)}><span className="profile-avatar">{(user?.name || "A").slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{user?.name || "Admin"}</strong><small>{user?.role === "SUPERADMIN" ? "Super Admin" : user?.role === "ADMIN" ? "Admin" : "Viewer"}</small></span><ChevronDown aria-hidden="true" /></button>{profileOpen && <div className="profile-menu"><div className="profile-menu-user"><strong>{user?.email}</strong><StatusBadge value={user?.role || "VIEWER"} /></div><button type="button" onClick={logout}><LogOut aria-hidden="true" />Sign out</button></div>}</div>
      </header>
      <main className="main-content" key={location.pathname}><div className="content-frame">{children}</div></main>
    </div>
    {open && <div className="mobile-nav-layer"><button aria-label="Close navigation" className="mobile-nav-overlay" onClick={() => setOpen(false)} /><aside className="sidebar mobile-sidebar"><div className="sidebar-brand">{brand}<button className="icon-button" type="button" aria-label="Close navigation" onClick={() => setOpen(false)}><X /></button></div>{sidebar}</aside></div>}
  </div>;
}
