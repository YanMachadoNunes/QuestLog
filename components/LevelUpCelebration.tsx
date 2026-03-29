"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ATTR_COLORS, ATTR_LABELS, ATTR_CLASSES, CHAR_CLASSES,
  getClass, isMilestoneLevel,
} from "@/lib/xp";
import { X, Star, Zap, TrendingUp } from "lucide-react";
import { sfxLevelUp } from "@/lib/sounds";

const CONFETTI_COLORS = ["#f59e0b", "#22c55e", "#60a5fa", "#c084fc", "#fb923c", "#22d3ee", "#ec4899"];

interface Piece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  anim: number;
}

function generateConfetti(count = 24): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 5 + Math.random() * 7,
    delay: Math.random() * 0.6,
    anim: (i % 3) + 1,
  }));
}

function Confetti() {
  const [pieces] = useState(generateConfetti);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit" }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confetti-${p.anim} ${1.2 + Math.random() * 0.8}s ease ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function LevelUpCelebration() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const attr = searchParams.get("levelup");
  const newLevel = parseInt(searchParams.get("newlevel") || "0");
  const milestone = searchParams.get("milestone") === "1";

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      router.replace(pathname, { scroll: false });
    }, 300);
  };

  useEffect(() => {
    if (attr && newLevel) {
      setVisible(true);
      setClosing(false);
      sfxLevelUp();
      const t = setTimeout(dismiss, 6000);
      return () => clearTimeout(t);
    }
  }, [attr, newLevel]);

  if (!visible || !attr || !newLevel) return null;

  const color = ATTR_COLORS[attr] || "#f59e0b";
  const attrLabel = ATTR_LABELS[attr] || attr;
  const attrTiers = ATTR_CLASSES[attr] || [];
  const newClass = getClass(attrTiers, newLevel);
  const prevClass = getClass(attrTiers, newLevel - 1);
  const classChanged = newClass.name !== prevClass.name;
  const charClass = getClass(CHAR_CLASSES, newLevel);
  const isMilestone = isMilestoneLevel(newLevel);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(8px)",
        opacity: closing ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
      onClick={dismiss}
    >
      <div
        style={{
          position: "relative",
          background: "#111",
          border: `1.5px solid ${color}40`,
          borderRadius: 20,
          padding: "40px 48px",
          maxWidth: 420,
          width: "90%",
          textAlign: "center",
          animation: "levelup-card 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
          boxShadow: `0 0 60px ${color}20, 0 0 120px ${color}08`,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Confetti />

        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "transparent",
            border: "none",
            color: "#333",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <X size={16} />
        </button>

        {/* Ring decorations */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: `1px solid ${color}15`,
            pointerEvents: "none",
          }}
        />

        {/* Attribute badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: `${color}15`,
            border: `2px solid ${color}50`,
            marginBottom: 20,
            fontSize: 20,
            fontWeight: 800,
            color,
            animation: "star-pop 0.5s 0.1s both",
            boxShadow: `0 0 24px ${color}30`,
          }}
        >
          {attr}
        </div>

        {/* "Level Up!" label */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: color,
            fontWeight: 700,
            marginBottom: 8,
            textTransform: "uppercase",
            animation: "float-in 0.4s 0.2s both",
          }}
        >
          ⚡ Level Up!
        </div>

        {/* Level number */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color,
            lineHeight: 1,
            animation: "number-bounce 0.5s 0.3s both",
            textShadow: `0 0 40px ${color}50`,
          }}
        >
          {newLevel}
        </div>

        {/* Attribute name */}
        <div
          style={{
            fontSize: 14,
            color: color,
            opacity: 0.75,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 20,
            animation: "float-in 0.4s 0.35s both",
          }}
        >
          {attrLabel}
        </div>

        {/* Class changed */}
        {classChanged && (
          <div
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              background: `${color}10`,
              border: `1px solid ${color}30`,
              marginBottom: 16,
              animation: "scale-in 0.4s 0.5s both",
            }}
          >
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 4 }}>
              NOVA CLASSE
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>
              {newClass.name}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
              {prevClass.name} → {newClass.name}
            </div>
          </div>
        )}

        {/* Milestone badge */}
        {isMilestone && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 20,
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              fontSize: 12,
              color: "#f59e0b",
              fontWeight: 700,
              marginBottom: 16,
              animation: "star-pop 0.4s 0.6s both",
            }}
          >
            <Star size={12} fill="#f59e0b" /> Marco de nível!
          </div>
        )}

        {/* Auto-dismiss bar */}
        <div
          style={{
            marginTop: 24,
            height: 2,
            background: "#1a1a1a",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: color,
              borderRadius: 1,
              animation: "progress-bar 6s linear forwards",
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: "#333", marginTop: 8 }}>
          clique para fechar
        </div>
      </div>
    </div>
  );
}
