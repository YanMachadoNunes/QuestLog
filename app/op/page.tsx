"use client";

import { useEffect, useState, useTransition } from "react";
import {
  initTestCharacter, setTestAttrLevel, setTestHp,
  setTestStreak, resetTestCharacter, getTestData,
} from "./actions";
import {
  getLevelInfo, getCharacterLevel, getGlobalRank,
  getAttributeTitle, ATTR_COLORS, ATTR_LABELS,
} from "@/lib/xp";
import { Zap, Heart, Flame, Play, RotateCcw, Minus, ChevronUp, Shield, ShieldCheck, Star, Globe, Crown, Sparkles } from "lucide-react";

const ATTRS = ["FRC", "INT", "CAR", "DES", "SAB"];
const LEVEL_PRESETS = [1, 5, 10, 20, 50, 100];

interface AttrState { type: string; xp: number; level: number }
interface CharState { hp: number; maxHp: number; streak: number }

function RankBadge({ rank }: { rank: ReturnType<typeof getGlobalRank> }) {
  const icons: Record<string, React.ReactNode> = {
    D:          <Minus size={11} />,
    C:          <ChevronUp size={11} />,
    B:          <Shield size={11} />,
    A:          <ShieldCheck size={12} />,
    S:          <Star size={13} fill="currentColor" />,
    Nacional:   <Globe size={13} />,
    Monarca:    <Crown size={14} fill="currentColor" />,
    Ascendente: <Sparkles size={14} />,
  };

  if (rank.name === "Ascendente") return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 13px", borderRadius: 8, whiteSpace: "nowrap",
      background: "linear-gradient(90deg, #e879f918, #f59e0b18, #60a5fa18, #e879f918)",
      backgroundSize: "300% 100%",
      border: "1.5px solid #e879f955",
      boxShadow: "0 0 20px #e879f966, 0 0 40px #f59e0b44",
      color: "#f0e6ff",
      fontSize: 12, fontWeight: 900, letterSpacing: 2,
      textTransform: "uppercase" as const,
      textShadow: "0 0 12px #e879f9, 0 0 24px #f59e0b88",
      animation: "ascendente-pulse 3s ease-in-out infinite",
      ["--rank-color" as string]: "#e879f966",
      ["--rank-color-faint" as string]: "#e879f922",
    }}>
      {icons["Ascendente"]} ASCENDENTE
    </span>
  );

  if (rank.name === "Monarca") return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap",
      background: `${rank.color}18`,
      border: `2px solid ${rank.color}70`,
      color: rank.color,
      fontSize: 12, fontWeight: 900, letterSpacing: 2,
      textTransform: "uppercase" as const,
      textShadow: `0 0 14px ${rank.color}cc`,
      animation: "rank-intense 2s ease-in-out infinite",
      ["--rank-color" as string]: `${rank.color}80`,
      ["--rank-color-faint" as string]: `${rank.color}25`,
    }}>
      {icons["Monarca"]} MONARCA
    </span>
  );

  if (rank.name === "Nacional") return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap",
      background: `${rank.color}15`,
      border: `2px solid ${rank.color}60`,
      color: rank.color,
      fontSize: 12, fontWeight: 900, letterSpacing: 2,
      textTransform: "uppercase" as const,
      textShadow: `0 0 12px ${rank.color}aa`,
      animation: "rank-intense 2.5s ease-in-out infinite",
      ["--rank-color" as string]: `${rank.color}70`,
      ["--rank-color-faint" as string]: `${rank.color}20`,
    }}>
      {icons["Nacional"]} NACIONAL
    </span>
  );

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap",
      background: `${rank.color}12`,
      border: `1.5px solid ${rank.color}${rank.minLevel >= 20 ? "55" : "35"}`,
      color: rank.color,
      fontSize: rank.minLevel >= 20 ? 13 : 12,
      fontWeight: 900, letterSpacing: 2,
      textShadow: `0 0 8px ${rank.color}80`,
      boxShadow: rank.minLevel >= 20
        ? `0 0 14px ${rank.color}40, inset 0 0 6px ${rank.color}10`
        : `0 0 4px ${rank.color}18`,
      animation: rank.minLevel >= 20 ? "rank-glow 2s ease-in-out infinite" : undefined,
      ["--rank-color" as string]: `${rank.color}55`,
      ["--rank-color-faint" as string]: `${rank.color}18`,
    }}>
      {icons[rank.name]} {rank.name.toUpperCase()}
    </span>
  );
}

export default function OpPage() {
  const [char, setChar]   = useState<CharState | null>(null);
  const [attrs, setAttrs] = useState<AttrState[]>([]);
  const [ready, setReady] = useState(false);
  const [pending, start]  = useTransition();
  const [levelInputs, setLevelInputs] = useState<Record<string, string>>({});

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

  function setLevel(attr: string, level: number) {
    const l = Math.max(1, Math.min(100, level));
    start(async () => { await setTestAttrLevel(attr, l); await load(); });
  }

  function adjustHp(delta: number) {
    if (!char) return;
    const newHp = Math.max(0, Math.min(char.maxHp, char.hp + delta));
    start(async () => { await setTestHp(newHp); await load(); });
  }

  function adjustStreak(delta: number) {
    if (!char) return;
    const newStreak = Math.max(0, char.streak + delta);
    start(async () => { await setTestStreak(newStreak); await load(); });
  }

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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e5e5e5", letterSpacing: 1 }}>/op — Sandbox</h1>
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
          {/* Rank badge area */}
          <div style={{ flexShrink: 0 }}>
            <RankBadge rank={rank} />
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>TEST</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: `${rank.color}12`, border: `1px solid ${rank.color}30`, color: rank.color, fontWeight: 700 }}>Lv. {charLevel}</span>
            </div>

            {/* HP row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Heart size={10} color={hpColor} />
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#1a1a1a", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${hpPct}%`, background: hpColor, borderRadius: 3, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 11, color: hpColor, minWidth: 52 }}>{char?.hp} / {char?.maxHp}</span>
              {/* HP controls */}
              <div style={{ display: "flex", gap: 4 }}>
                {[-20, -10, +10, +20].map(d => (
                  <button key={d} disabled={pending} onClick={() => adjustHp(d)}
                    style={{ padding: "2px 7px", borderRadius: 5, border: `1px solid ${d < 0 ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, background: d < 0 ? "rgba(239,68,68,0.07)" : "rgba(34,197,94,0.07)", color: d < 0 ? "#ef4444" : "#22c55e", fontSize: 10, cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Streak row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flame size={10} color="#f59e0b" />
              <span style={{ fontSize: 11, color: "#f59e0b", minWidth: 52 }}>{char?.streak ?? 0} dias</span>
              <div style={{ display: "flex", gap: 4 }}>
                {[-1, +1, +7, +14].map(d => (
                  <button key={d} disabled={pending} onClick={() => adjustStreak(d)}
                    style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.07)", color: "#f59e0b", fontSize: 10, cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>
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
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <div style={{ minWidth: 36, fontSize: 12, fontWeight: 800, color, letterSpacing: 1 }}>{attr.type}</div>
                <div style={{ fontSize: 11, color: "#555", minWidth: 90 }}>{ATTR_LABELS[attr.type]}</div>

                {/* Progress bar */}
                <div style={{ flex: 1, minWidth: 80 }}>
                  <div style={{ height: 4, borderRadius: 2, background: "#1a1a1a", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                </div>

                <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 40, textAlign: "right" }}>Lv.{level}</span>
                <span style={{ fontSize: 10, color: "#444", minWidth: 90 }}>{title}</span>
              </div>

              {/* Level buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, color: "#333", marginRight: 2 }}>SET:</span>
                {LEVEL_PRESETS.map(l => (
                  <button
                    key={l}
                    disabled={pending}
                    onClick={() => setLevel(attr.type, l)}
                    style={{
                      padding: "3px 9px", borderRadius: 5,
                      border: `1px solid ${level === l ? `${color}60` : `${color}20`}`,
                      background: level === l ? `${color}20` : `${color}08`,
                      color: level === l ? color : "#444",
                      fontSize: 10, cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)",
                      transition: "all 0.15s",
                    }}
                  >
                    L{l}
                  </button>
                ))}

                {/* Custom level input */}
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 4 }}>
                  <div style={{ position: "relative" }}>
                    <Zap size={9} color="#f59e0b" style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                      type="number"
                      placeholder="nível"
                      min={1} max={100}
                      value={levelInputs[attr.type] ?? ""}
                      onChange={(e) => setLevelInputs(p => ({ ...p, [attr.type]: e.target.value }))}
                      style={{ width: 72, padding: "4px 8px 4px 20px", borderRadius: 5, border: "1px solid #222", background: "#0d0d0d", color: "#f59e0b", fontSize: 10, fontFamily: "var(--font-mono)", outline: "none" }}
                    />
                  </div>
                  <button
                    disabled={pending}
                    onClick={() => {
                      const val = parseInt(levelInputs[attr.type] ?? "");
                      if (isNaN(val)) return;
                      setLevel(attr.type, val);
                      setLevelInputs(p => ({ ...p, [attr.type]: "" }));
                    }}
                    style={{ padding: "4px 9px", borderRadius: 5, border: `1px solid ${color}30`, background: `${color}10`, color, fontSize: 10, cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-mono)" }}
                  >
                    OK
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 10, color: "#2a2a2a", marginTop: 6 }}>
                {currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP · total: {attr.xp.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rank reference */}
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Referência de Ranks</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { name: "D",          min: 0,   color: "#9ca3af" },
            { name: "C",          min: 5,   color: "#60a5fa" },
            { name: "B",          min: 10,  color: "#34d399" },
            { name: "A",          min: 15,  color: "#a78bfa" },
            { name: "S",          min: 20,  color: "#f59e0b" },
            { name: "Nacional",   min: 30,  color: "#f97316" },
            { name: "Monarca",    min: 50,  color: "#ec4899" },
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
