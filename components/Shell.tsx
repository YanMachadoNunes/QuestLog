"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Sword, BarChart3, ScrollText, Volume2, VolumeX, Plus, Menu, X } from "lucide-react";
import { toggleMute, getMuted, sfxClick } from "@/lib/sounds";

const NAV = [
  { href: "/",           icon: LayoutDashboard, label: "Dashboard", color: "#f59e0b" },
  { href: "/quests",     icon: Sword,            label: "Quests",    color: "#22d3ee" },
  { href: "/attributes", icon: BarChart3,        label: "Atributos", color: "#c084fc" },
  { href: "/log",        icon: ScrollText,       label: "Log",       color: "#22c55e" },
];

function SidebarContent({
  pathname,
  muted,
  onMuteToggle,
  onLinkClick,
}: {
  pathname: string;
  muted: boolean;
  onMuteToggle: () => void;
  onLinkClick: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px 12px" }}>
      {/* Logo */}
      <div style={{ padding: "4px 8px 20px", marginBottom: 4, borderBottom: "1px solid #181818" }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ color: "#f59e0b" }}>⚔</span>
          <span style={{ color: "#e5e5e5" }}>QUEST</span><span style={{ color: "#f59e0b" }}>LOG</span>
        </div>
        <div style={{ fontSize: 9, color: "#2e2e2e", marginTop: 4, letterSpacing: 2 }}>
          GAMIFIED PRODUCTIVITY
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, marginTop: 8 }}>
        {NAV.map(({ href, icon: Icon, label, color }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8,
                textDecoration: "none",
                background: active ? `${color}0e` : "transparent",
                borderLeft: active ? `2px solid ${color}` : "2px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#141414";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: active ? `${color}12` : "#111",
                border: `1px solid ${active ? color + "22" : "#1c1c1c"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: active ? `0 0 10px ${color}15` : undefined,
              }}>
                <Icon size={14} color={active ? color : "#3a3a3a"} />
              </div>
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 400,
                color: active ? "#d0d0d0" : "#555",
                letterSpacing: 0.2,
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #181818", paddingTop: 14 }}>
        <Link
          href="/quests/new"
          onClick={onLinkClick}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "9px", borderRadius: 8,
            background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.16)",
            color: "#f59e0b", textDecoration: "none",
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(245,158,11,0.12)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(245,158,11,0.07)")}
        >
          <Plus size={13} /> Nova Quest
        </Link>
        <button
          onClick={onMuteToggle}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px", borderRadius: 8,
            background: "transparent", border: "1px solid #1a1a1a",
            color: "#2e2e2e", cursor: "pointer",
            fontSize: 11, fontFamily: "var(--font-mono)",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#555";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#2e2e2e";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1a1a";
          }}
        >
          {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          <span>{muted ? "Mudo" : "Som ativo"}</span>
        </button>
      </div>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [muted,      setMuted]      = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMuted(getMuted()); }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleToggleMute = () => {
    const next = toggleMute();
    setMuted(next);
    if (!next) sfxClick();
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop sidebar — always visible ≥769px */}
      <aside className="sidebar-desktop">
        <SidebarContent
          pathname={pathname}
          muted={muted}
          onMuteToggle={handleToggleMute}
          onLinkClick={() => {}}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 150,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Mobile sidebar — slides in from left */}
      <aside
        className="sidebar-mobile"
        style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-220px)" }}
      >
        <SidebarContent
          pathname={pathname}
          muted={muted}
          onMuteToggle={handleToggleMute}
          onLinkClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="mobile-menu-btn"
        aria-label="Menu"
      >
        {mobileOpen
          ? <X    size={17} color="#666" />
          : <Menu size={17} color="#f59e0b" />
        }
      </button>

      <main className="shell-main">
        {children}
      </main>
    </div>
  );
}
