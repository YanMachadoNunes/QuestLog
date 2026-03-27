"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Sword, BarChart3, ScrollText, Menu, X, Volume2, VolumeX } from "lucide-react";
import { toggleMute, getMuted, sfxClick } from "@/lib/sounds";

const NAV = [
  { href: "/",           icon: LayoutDashboard, label: "Dashboard", color: "#f59e0b" },
  { href: "/quests",     icon: Sword,            label: "Quests",    color: "#22d3ee" },
  { href: "/attributes", icon: BarChart3,        label: "Atributos", color: "#c084fc" },
  { href: "/log",        icon: ScrollText,       label: "Log",       color: "#22c55e" },
];

// Vertical straight line going up from toggle
const GAP    = 64;   // px between item centers
const OFFSET = 16;   // gap between toggle top edge and first item bottom
const ITEM_H = 50;

const POSITIONS = NAV.map((_, i) => ({
  x: 0,
  y: -(OFFSET + ITEM_H + GAP * i),
}));
// → (0,-66), (0,-130), (0,-194), (0,-258)

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open,    setOpen]    = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [muted,   setMuted]   = useState(false);
  const pathname              = usePathname();
  const menuRef               = useRef<HTMLDivElement>(null);

  // Init mute state from localStorage after mount
  useEffect(() => { setMuted(getMuted()); }, []);

  const handleToggleMute = () => {
    const next = toggleMute();
    setMuted(next);
    if (!next) sfxClick(); // play a click when unmuting
  };

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  useEffect(() => { setOpen(false); setHovered(null); }, [pathname]);

  // Total height of the spine (from toggle center to center of top item)
  const spineHeight = OFFSET + ITEM_H * NAV.length + GAP * (NAV.length - 1) + 4;

  return (
    <div style={{ minHeight: "100vh" }}>
      <main className="shell-main">
        {children}
      </main>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 150,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Menu root — fixed bottom-left */}
      <div
        ref={menuRef}
        className="menu-toggle"
      >
        {/* Vertical spine */}
        {open && (
          <div
            style={{
              position: "absolute",
              bottom: ITEM_H + 2,           // starts above toggle center
              left: "50%",
              transform: "translateX(-0.5px)",
              width: 1,
              height: spineHeight,
              background: "linear-gradient(to top, rgba(245,158,11,0.3), rgba(245,158,11,0.04))",
              animation: "spine-grow 0.35s ease forwards",
              transformOrigin: "bottom",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Nav items */}
        {NAV.map(({ href, icon: Icon, label, color }, i) => {
          const { x, y } = POSITIONS[i];
          const active   = pathname === href;
          const isHover  = hovered === i;
          const delay    = i * 0.05;

          return (
            <div
              key={href}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                bottom: 4,
                left: 4,
                width: ITEM_H,
                height: ITEM_H,
                transform: open
                  ? `translate(${x}px, ${y}px) scale(1)`
                  : "translate(0, 0) scale(0.2)",
                opacity: open ? 1 : 0,
                transition: [
                  `transform 0.38s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s`,
                  `opacity   0.2s ease ${delay}s`,
                ].join(", "),
                pointerEvents: open ? "auto" : "none",
              }}
            >
              {/* Label — right side, hover only */}
              <div
                style={{
                  position: "absolute",
                  left: ITEM_H + 12,
                  top: "50%",
                  transform: `translateY(-50%) translateX(${isHover ? "0px" : "-8px"})`,
                  opacity: isHover ? 1 : 0,
                  transition: "opacity 0.15s ease, transform 0.15s ease",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  background: "#0e0e0e",
                  border: `1px solid ${active ? color + "40" : "#222"}`,
                  borderRadius: 7,
                  padding: "5px 11px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: active ? color : "#aaa",
                  letterSpacing: 0.5,
                  boxShadow: "0 4px 18px rgba(0,0,0,0.6)",
                }}
              >
                {/* left arrow caret */}
                <span style={{
                  position: "absolute",
                  right: "100%",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderTop: "4px solid transparent",
                  borderBottom: "4px solid transparent",
                  borderRight: `5px solid ${active ? color + "40" : "#222"}`,
                  display: "block",
                }} />
                {label}
              </div>

              {/* Circle */}
              <Link
                href={href}
                onClick={() => { setOpen(false); sfxClick(); }}
                style={{ display: "block", textDecoration: "none" }}
              >
                <div
                  style={{
                    width: ITEM_H,
                    height: ITEM_H,
                    borderRadius: "50%",
                    background: active
                      ? `${color}18`
                      : isHover
                      ? `${color}0c`
                      : "#0f0f0f",
                    border: `1.5px solid ${
                      active   ? color + "55"
                      : isHover ? color + "30"
                      : "#1c1c1c"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: isHover && !active ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.17s ease",
                    boxShadow: active
                      ? `0 0 20px ${color}28, inset 0 0 10px ${color}08`
                      : isHover
                      ? `0 0 12px ${color}18`
                      : "0 4px 16px rgba(0,0,0,0.5)",
                  }}
                >
                  <Icon size={18} color={active ? color : isHover ? color : "#444"} />
                </div>
              </Link>

              {/* Active dot */}
              {active && (
                <span style={{
                  position: "absolute",
                  bottom: -6, left: "50%",
                  transform: "translateX(-50%)",
                  width: 4, height: 4,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  display: "block",
                }} />
              )}
            </div>
          );
        })}

        {/* Toggle */}
        <button
          onClick={() => { setOpen((v) => !v); setHovered(null); }}
          aria-label="Menu"
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: open ? "#141414" : "rgba(245,158,11,0.09)",
            border: `2px solid ${open ? "#242424" : "rgba(245,158,11,0.38)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            zIndex: 10,
            transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
            boxShadow: open
              ? "none"
              : "0 0 28px rgba(245,158,11,0.14), 0 6px 24px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{
            transition: "transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",
            transform: open ? "rotate(135deg)" : "rotate(0deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {open
              ? <X    size={20} color="#555" />
              : <Menu size={20} color="#f59e0b" />
            }
          </div>

          {!open && (
            <>
              <span style={{
                position: "absolute", inset: -7, borderRadius: "50%",
                border: "1px solid rgba(245,158,11,0.2)",
                animation: "ring-expand 3s ease-out infinite",
                pointerEvents: "none",
              }} />
              <span style={{
                position: "absolute", inset: -7, borderRadius: "50%",
                border: "1px solid rgba(245,158,11,0.08)",
                animation: "ring-expand 3s ease-out 1.5s infinite",
                pointerEvents: "none",
              }} />
            </>
          )}
        </button>

        {/* App label */}
        <div style={{
          position: "absolute",
          left: 68, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 10, fontWeight: 700,
          color: open ? "transparent" : "#2a2a2a",
          letterSpacing: 3,
          userSelect: "none",
          whiteSpace: "nowrap",
          transition: "color 0.18s",
          pointerEvents: "none",
        }}>
          QUESTLOG
        </div>
      </div>

      {/* Mute toggle — fixed bottom-right */}
      <button
        onClick={handleToggleMute}
        title={muted ? "Ativar sons" : "Silenciar"}
        className="mute-btn"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: muted ? "#111" : "rgba(245,158,11,0.06)",
          border: `1.5px solid ${muted ? "#222" : "rgba(245,158,11,0.2)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.2s, border-color 0.2s, opacity 0.2s",
          opacity: muted ? 0.5 : 0.7,
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = muted ? "0.5" : "0.7")}
      >
        {muted
          ? <VolumeX size={15} color="#555" />
          : <Volume2 size={15} color="#f59e0b" />
        }
      </button>
    </div>
  );
}
