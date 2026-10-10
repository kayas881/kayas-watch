import { Activity, Globe, LayoutDashboard, LogOut, Menu, Settings, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const nav = [{ to: "/", label: "Dashboard", icon: LayoutDashboard }, { to: "/clients", label: "Clients", icon: Users }, { to: "/websites", label: "Websites", icon: Globe }, { to: "/monitors", label: "Monitors", icon: Activity }, { to: "/settings", label: "Settings", icon: Settings }];
export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false);
  const sidebar = <nav className="flex-1 space-y-1 p-4">{nav.map(item => <NavLink onClick={() => setOpen(false)} end={item.to === "/"} key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${isActive ? "bg-gradient-to-r from-purple-600/20 to-violet-900/30 text-purple-300 border border-purple-500/20" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}><item.icon className="w-5 h-5"/>{item.label}</NavLink>)}</nav>;
  return <div className="h-screen overflow-hidden flex flex-col">
    <header className="h-16 shrink-0 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-30">
      <div className="flex items-center gap-3"><button className="md:hidden text-zinc-400" onClick={() => setOpen(true)}><Menu/></button><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/30 to-violet-900/40 border border-purple-500/30 flex items-center justify-center glow"><Activity className="w-5 h-5 text-purple-400"/></div><div><div className="font-bold text-white text-sm sm:text-base">Saral Watch <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 uppercase">Saral Infosoft</span></div><div className="text-[10px] text-zinc-500">Web & Infrastructure Monitor</div></div></div>
      <div className="flex items-center gap-4"><div className="hidden sm:block text-right"><div className="text-sm font-medium">{user?.name || "Admin"}</div><div className="text-xs text-zinc-500">{user?.email}</div></div><button onClick={logout} className="btn btn-ghost border-0"><LogOut className="w-4 h-4"/><span className="hidden sm:inline">Sign out</span></button></div>
    </header>
    <div className="flex flex-1 overflow-hidden"><aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 hidden md:flex flex-col">{sidebar}</aside><main className="flex-1 overflow-y-auto"><div className="p-5 md:p-8 max-w-7xl mx-auto">{children}</div></main></div>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Close menu" className="absolute inset-0 bg-black/70 w-full" onClick={() => setOpen(false)}/><aside className="absolute left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col"><div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800 font-bold">Saral Watch<button onClick={() => setOpen(false)}><X/></button></div>{sidebar}</aside></div>}
  </div>;
}
