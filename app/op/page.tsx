"use client";

import { useEffect, useState, useTransition } from "react";
import {
  initTestCharacter, setTestAttrXp, setTestHp,
  setTestStreak, resetTestCharacter, getTestData,
} from "./actions";
import {
  getLevelInfo, getCharacterLevel, getGlobalRank,
  getAttributeTitle, ATTR_COLORS, ATTR_LABELS,
} from "@/lib/xp";
import { Zap, Heart, Flame, RefreshCw, Play, RotateCcw } from "lucide-react";

const ATTRS = ["FRC", "INT", "CAR", "DES", "SAB"];

interface AttrState { type: string; xp: number; level: number }
interface CharState { hp: number; maxHp: number; streak: number }

export default function OpPage() {
  const [char, setChar]   = useState<CharState | null>(null);
  const [attrs, setAttrs] = useState<AttrState[]>([]);
  const [ready, setReady] = useState(false);
  const [pending, start]  = useTransition();

  const [xpInputs, setXpInputs]       = useState<Record<string, string>>({});
  const [hpInput, setHpInput]         = useState("");
  const [streakInput, setStreakInput] = useState("");

  async function load() {
    const { char: c, attrs: a } = await getTestData();
    if (c) {
      setChar({ hp: c.hp, maxHp: c.maxHp, streak: c.streak });
      setReady(true);
    }
    if (a.length) {
      setAttrs(a.map(x => ({ type: x.type.replace("_test", ""), xp: x.xp, level: x.level })));
    }
  }

  useEffect(() => { load(); }, []);

  const attrMap   = Object.fromEntries(attrs.map(a => [a.type, a]));
  const allAttrs  = ATTRS.map(t => attrMap[t] ?? { type: t, xp: 0, level: 1 });
  const charLevel = getCharacterLevel(allAttrs.map(a => a.level));
  const rank      = getGlobalRank(charLevel);
  const hpPct     = char ? Math.round((char.hp / char.maxHp) * 100) : 100;
  const hpColor   = hpPct <= 25 ? "#ef4444" : hpPct <= 50 ? "#f59e0b" : "#22c55e";

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: "#444" }}>Personagem de teste não inicializado.</div>
      <button
        onClick={() => start(async () => { await initTestCharacter(); await load(); })}
        disabled={pending}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-mono)" }}
      >
        <Play size={14} /> Inicializar Personagem de Teste
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 0" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e5e5e5", letterSpacing: 1 }}>
            /op — Sandbox
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>Personagem de teste isolado. Seus dados reais não são afetados.</p>
        </div>
        <button
          onClick={() => start(async () => { await resetTestCharacter(); await load(); })}
          disabled={pending}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #222", background: "#0d0d0d", color: "#555", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)" }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* Character Card */}
      <div style={{ background: "#111", border: `1px solid ${rank.color}25`, borderRadius: 12, padding: "20px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${rank.color}08 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Rank badge */}
          <div style={{ width: 56, height: 56, borderRadius: 10, background: `${rank.color}15`, border: `2px solid ${rank.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: rank.color, letterSpacing: 2, textShadow: `0 0 12px ${rank.color}90`, flexShrink: 0 }}>
            {rank.name}
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>TEST</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: `${rank.color}12`, border: `1px solid ${rank.color}30`, color: rank.color, fontWeight: 700 }}>Lv. {charLevel}</span>
            </div>

            {/* HP */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Heart size={10} color={hpColor} />
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#1a1a1a", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${hpPct}%`, background: hpColor, borderRadius: 3, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 11, color: hpColor, minWidth: 52 }}>{char?.hp} / {char?.maxHp}</span>
            </div>

            {char && char.streak > 0 && (
              <span style={{ fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                <Flame size={10} /> {char.streak} dias
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Attribute Editors */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Atributos</div>
        {allAttrs.map((attr) => {
          const color = ATTR_COLORS[attr.type];
          const { level, currentXP, xpForNext, progress } = getLevelInfo(attr.xp);
          const title = getAttributeTitle(attr.type as "FRC", level);

          return (
            <div key={attr.type} style={{ background: "#111", border: "1px solid #1a1a1a", borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Label */}
                <div style={{ minWidth: 36, fontSize: 12, fontWeight: 800, color, letterSpacing: 1 }}>{attr.type}</div>
                <div style={{ fontSize: 11, color: "#555", minWidth: 80 }}>{ATTR_LABELS[attr.type]}</div>

                {/* Progress bar */}
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ height: 4, borderRadius: 2, background: "#1a1a1a", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                </div>

                {/* Level + class */}
                <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 40, textAlign: "right" }}>Lv.{level}</span>
                <span style={{ fontSize: 10, color: "#444", minWidth: 80 }}>{title}</span>

                {/* XP input */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ position: "relative" }}>
                    <Zap size={10} color="#f59e0b" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                      type="number"
                      placeholder={`${attr.xp}`}
                      value={xpInputs[attr.type] ?? ""}
                      onChange={(e) => setXpInputs(p => ({ ...p, [attr.type]: e.target.value }))}
                      style={{ width: 90, padding: "5px 8px 5px 22px", borderRadius: 6, border: "1px solid #222", background: "#0d0d0d", color: "#f59e0b", fontSize: 11, fontFamily: "var(--font-mono)", outline: "none" }}
                    />
                  </div>
                  <button
                    disabled={pending}
                    onClick={() => {
                      const val = parseInt(xpInputs[attr.type] ?? "");
                      if (isNaN(val)) return;
                      start(async () => { await setTestAttrXp(attr.type, val); await load(); setXpInputs(p => ({ ...p, [attr.type]: "" })); });
                    }}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${color}30`, background: `${color}10`, color, fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}
                  >
                    SET
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 10, color: "#333", marginTop: 6 }}>
                {currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP · total: {attr.xp.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* HP + Streak editors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>HP</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="number"
              placeholder={String(char?.hp ?? 100)}
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value)}
              style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #222", background: "#0d0d0d", color: "#22c55e", fontSize: 12, fontFamily: "var(--font-mono)", outline: "none" }}
            />
            <button
              disabled={pending}
              onClick={() => {
                const val = parseInt(hpInput);
                if (isNaN(val)) return;
                start(async () => { await setTestHp(val); await load(); setHpInput(""); });
              }}
              style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#22c55e", fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}
            >
              SET
            </button>
          </div>
        </div>

        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Streak</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="number"
              placeholder={String(char?.streak ?? 0)}
              value={streakInput}
              onChange={(e) => setStreakInput(e.target.value)}
              style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #222", background: "#0d0d0d", color: "#f59e0b", fontSize: 12, fontFamily: "var(--font-mono)", outline: "none" }}
            />
            <button
              disabled={pending}
              onClick={() => {
                const val = parseInt(streakInput);
                if (isNaN(val)) return;
                start(async () => { await setTestStreak(val); await load(); setStreakInput(""); });
              }}
              style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}
            >
              SET
            </button>
          </div>
        </div>
      </div>

      {/* Rank reference */}
      <div style={{ marginTop: 24, background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Referência de Ranks</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { name: "D", min: 0, color: "#9ca3af" },
            { name: "C", min: 5, color: "#60a5fa" },
            { name: "B", min: 10, color: "#34d399" },
            { name: "A", min: 15, color: "#a78bfa" },
            { name: "S", min: 20, color: "#f59e0b" },
            { name: "Nacional", min: 30, color: "#f97316" },
            { name: "Monarca", min: 50, color: "#ec4899" },
            { name: "Ascendente", min: 100, color: "#e879f9" },
          ].map(r => (
            <div key={r.name} style={{
              padding: "4px 10px", borderRadius: 5,
              background: charLevel >= r.min ? `${r.color}15` : "#0d0d0d",
              border: `1px solid ${charLevel >= r.min ? `${r.color}45` : "#1a1a1a"}`,
              color: charLevel >= r.min ? r.color : "#2a2a2a",
              fontSize: 11, fontWeight: 700,
            }}>
              {r.name} <span style={{ fontSize: 9, opacity: 0.6 }}>Lv{r.min}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
