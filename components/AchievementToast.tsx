"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ACHIEVEMENT_META } from "@/lib/achievements";
import { sfxAchievement } from "@/lib/sounds";

export default function AchievementToast() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();
  const [visible, setVisible]   = useState(false);
  const [key, setKey]           = useState("");
  const [exiting, setExiting]   = useState(false);

  useEffect(() => {
    const ach = searchParams.get("achievement");
    if (ach && ACHIEVEMENT_META[ach]) {
      setKey(ach);
      setVisible(true);
      setExiting(false);
      sfxAchievement();

      const timer = setTimeout(() => dismiss(), 5000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      const p = new URLSearchParams(searchParams.toString());
      p.delete("achievement");
      const qs = p.toString();
      router.replace(`${pathname}${qs ? "?" + qs : ""}`, { scroll: false });
    }, 350);
  };

  if (!visible || !ACHIEVEMENT_META[key]) return null;

  const meta = ACHIEVEMENT_META[key];

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed",
        bottom: 100,
        right: 24,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 18px",
        background: "#111",
        border: `1px solid ${meta.color}35`,
        borderRadius: 12,
        boxShadow: `0 0 24px ${meta.color}18, 0 4px 20px rgba(0,0,0,0.5)`,
        cursor: "pointer",
        animation: exiting
          ? "achievement-out 0.35s ease forwards"
          : "achievement-in 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
        maxWidth: 280,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${meta.color}12`, border: `1px solid ${meta.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>
        {meta.icon}
      </div>

      {/* Text */}
      <div>
        <div style={{ fontSize: 9, color: meta.color, fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>
          CONQUISTA DESBLOQUEADA
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5" }}>{meta.label}</div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{meta.desc}</div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: 2, borderRadius: "0 0 12px 12px",
        background: meta.color,
        animation: "progress-bar 5s linear forwards",
        width: "100%",
      }} />
    </div>
  );
}
