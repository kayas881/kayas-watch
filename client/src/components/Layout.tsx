import { Activity, ChevronDown, Globe, LayoutDashboard, LogOut, MonitorCog, Settings, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge } from "./ui";

const nav = [{ to: "/", label: "Dashboard", icon: LayoutDashboard }, { to: "/clients", label: "Clients", icon: Users }, { to: "/websites", label: "Websites", icon: Globe }, { to: "/monitors", label: "Monitors", icon: Activity }, { to: "/settings", label: "Settings", icon: Settings }];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const currentPage = nav.find(item => item.to === "/" ? location.pathname === "/" : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))?.label || "Workspace";
  const brand = <div className="brand-lockup"><div className="brand-mark"><Activity aria-hidden="true" /></div><div><strong>Saral Watch</strong><span>By Saral Infosoft</span></div></div>;
  const sidebar = <><nav className="sidebar-nav" aria-label="Main navigation">{nav.map(item => <NavLink end={item.to === "/"} key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}><item.icon aria-hidden="true" /><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-pulse"><MonitorCog aria-hidden="true" /><p>Monitoring made clear</p><span>Live availability and security signals for every client website.</span></div></>;

  return <div className="app-shell">
    <aside className="sidebar sidebar-desktop"><div className="sidebar-brand">{brand}</div>{sidebar}</aside>
    <div className="app-workspace">
      <header className="topbar">
        <div className="topbar-context"><span>Saral Watch</span><span aria-hidden="true">/</span><strong>{currentPage}</strong></div>
        <div className="profile-wrap"><button className="profile-trigger" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen(value => !value)}><span className="profile-avatar">{(user?.name || "A").slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{user?.name || "Admin"}</strong><small>{user?.role === "SUPERADMIN" ? "Super Admin" : user?.role === "ADMIN" ? "Admin" : "Viewer"}</small></span><ChevronDown aria-hidden="true" /></button>{profileOpen && <div className="profile-menu"><div className="profile-menu-user"><strong>{user?.email}</strong><StatusBadge value={user?.role || "VIEWER"} /></div><button type="button" onClick={logout}><LogOut aria-hidden="true" />Sign out</button></div>}</div>
      </header>
      <main className="main-content" key={location.pathname}><div className="content-frame">{children}</div></main>
    </div>
  </div>;
}
