"use client";

import { createQuest } from "@/lib/actions";
import { ATTR_COLORS, ATTR_LABELS } from "@/lib/xp";
import Link from "next/link";
import { ArrowLeft, Zap, Shield, Plus, X } from "lucide-react";
import { useState } from "react";

const ATTRS = ["FRC", "INT", "CAR", "DES", "SAB"];

type QuestType = "DAILY" | "EPIC" | "BOSS";
type Difficulty = "EASY" | "NORMAL" | "HARD";

const TYPE_META = {
  DAILY: { label: "⚡ DAILY", color: "#22d3ee" },
  EPIC:  { label: "★ EPIC",  color: "#f59e0b" },
  BOSS:  { label: "☠ BOSS",  color: "#ef4444" },
};

const DIFF_META: { key: Difficulty; label: string; color: string; mult: number }[] = [
  { key: "EASY",   label: "EASY",   color: "#22c55e", mult: 0.5 },
  { key: "NORMAL", label: "NORMAL", color: "#555",    mult: 1   },
  { key: "HARD",   label: "HARD",   color: "#ef4444", mult: 2   },
];

export default function NewQuestPage() {
  const [type,       setType]       = useState<QuestType>("DAILY");
  const [attr,       setAttr]       = useState("INT");
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [subTasks,   setSubTasks]   = useState<string[]>([""]);

  const showSubTasks = type === "EPIC" || type === "BOSS";
  const bossXpMult  = type === "BOSS" ? 3 : 1;
  const diffMult    = type === "BOSS" ? 3 : (difficulty === "EASY" ? 0.5 : difficulty === "HARD" ? 2 : 1);
  const baseDefault = type === "DAILY" ? 50 : type === "EPIC" ? 250 : 500;

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>

      <div style={{ width: "100%", maxWidth: 520, marginBottom: 20 }}>
        <Link href="/quests" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#444", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#888")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#444")}
        >
          <ArrowLeft size={12} /> voltar
        </Link>
      </div>

      <div className="animate-scale-in" style={{ width: "100%", maxWidth: 520, background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "32px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)", marginBottom: 14, animation: "glow-pulse 3s ease-in-out infinite" }}>
            <Shield size={20} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f0f0f0", letterSpacing: 0.5, margin: 0 }}>Nova Quest</h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#444" }}>Defina a missão e o atributo que ela treina</p>
        </div>

        <form action={createQuest} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Quest Type */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>Tipo</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {(Object.entries(TYPE_META) as [QuestType, typeof TYPE_META[QuestType]][]).map(([t, meta]) => (
                <button key={t} type="button" onClick={() => setType(t)} style={{
                  padding: "10px 6px", borderRadius: 9,
                  border: `1px solid ${type === t ? `${meta.color}45` : "#1a1a1a"}`,
                  background: type === t ? `${meta.color}10` : "#0d0d0d",
                  color: type === t ? meta.color : "#444",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-mono)", letterSpacing: 0.5,
                  transition: "all 0.15s",
                }}>
                  {meta.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="type" value={type} />
            {type === "BOSS" && (
              <p style={{ margin: "6px 0 0", fontSize: 10, color: "#555" }}>
                ☠ ×3 XP · -{30} HP ao falhar · Missão de alto risco
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>Dificuldade</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {DIFF_META.map(({ key, label, color, mult }) => {
                const active = difficulty === key;
                const m = type === "BOSS" ? bossXpMult : mult;
                return (
                  <button key={key} type="button"
                    onClick={() => { if (type !== "BOSS") setDifficulty(key); }}
                    disabled={type === "BOSS"}
                    style={{
                      padding: "9px 6px", borderRadius: 9,
                      border: `1px solid ${active && type !== "BOSS" ? `${color}40` : "#1a1a1a"}`,
                      background: active && type !== "BOSS" ? `${color}10` : "#0d0d0d",
                      color: type === "BOSS" ? "#2a2a2a" : active ? color : "#444",
                      fontSize: 11, fontWeight: 700, cursor: type === "BOSS" ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-mono)", letterSpacing: 0.5,
                      transition: "all 0.15s",
                    }}
                  >
                    <div>{label}</div>
                    <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>×{m}</div>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="difficulty" value={type === "BOSS" ? "NORMAL" : difficulty} />
          </div>

          {/* Title */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>Título *</label>
            <input name="title" required autoFocus
              placeholder={type === "DAILY" ? "ex: Commit do dia" : type === "BOSS" ? "ex: Finalizar MVP" : "ex: Lançar feature financeira"}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#e5e5e5", fontSize: 13, fontFamily: "var(--font-mono)", outline: "none", transition: "border-color 0.15s" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Descrição <span style={{ color: "#333" }}>(opcional)</span>
            </label>
            <textarea name="description" rows={2} placeholder="Critério de conclusão, contexto..."
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#e5e5e5", fontSize: 12, fontFamily: "var(--font-mono)", resize: "vertical", outline: "none", lineHeight: 1.5, transition: "border-color 0.15s" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
            />
          </div>

          {/* Attribute */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>Atributo</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ATTRS.map((a) => {
                const c = ATTR_COLORS[a];
                return (
                  <button key={a} type="button" onClick={() => setAttr(a)} style={{
                    padding: "11px 12px", borderRadius: 9,
                    border: `1px solid ${attr === a ? `${c}40` : "#1a1a1a"}`,
                    background: attr === a ? `${c}10` : "#0d0d0d",
                    color: attr === a ? c : "#444",
                    fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)", textAlign: "left", transition: "all 0.15s",
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 1 }}>{a}</div>
                    <div style={{ fontSize: 10, color: attr === a ? `${c}aa` : "#333" }}>{ATTR_LABELS[a]}</div>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="attribute" value={attr} />
          </div>

          {/* XP Reward */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>
              XP Base{diffMult !== 1 && <span style={{ color: "#f59e0b", marginLeft: 6 }}>× {diffMult} = efetivo</span>}
            </label>
            <div style={{ position: "relative" }}>
              <Zap size={13} color="#f59e0b" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input name="xpReward" type="number" min={10} max={9999} step={10} defaultValue={baseDefault} key={type}
                style={{ width: "100%", padding: "11px 14px 11px 34px", borderRadius: 9, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#f59e0b", fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, outline: "none" }}
              />
            </div>
          </div>

          {/* Due date (EPIC + BOSS) */}
          {(type === "EPIC" || type === "BOSS") && (
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>
                Prazo <span style={{ color: "#333" }}>(opcional)</span>
              </label>
              <input name="dueDate" type="date"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#666", fontSize: 13, fontFamily: "var(--font-mono)", outline: "none" }}
              />
            </div>
          )}

          {/* Sub-tasks (EPIC + BOSS) */}
          {showSubTasks && (
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>
                Sub-tarefas <span style={{ color: "#333" }}>(opcional)</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {subTasks.map((val, i) => (
                  <div key={i} style={{ display: "flex", gap: 6 }}>
                    <input
                      name="subTask"
                      value={val}
                      onChange={(e) => {
                        const next = [...subTasks]; next[i] = e.target.value; setSubTasks(next);
                      }}
                      placeholder={`Etapa ${i + 1}`}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#e5e5e5", fontSize: 12, fontFamily: "var(--font-mono)", outline: "none" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
                    />
                    {subTasks.length > 1 && (
                      <button type="button" onClick={() => setSubTasks(subTasks.filter((_, j) => j !== i))}
                        style={{ padding: "0 10px", borderRadius: 8, border: "1px solid #1a1a1a", background: "transparent", color: "#333", cursor: "pointer", transition: "color 0.15s" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#333")}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setSubTasks([...subTasks, ""])}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px dashed #222", background: "transparent", color: "#444", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)", transition: "color 0.15s, border-color 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#888"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#444"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#222"; }}
                >
                  <Plus size={11} /> Adicionar etapa
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" style={{
            width: "100%", padding: "13px", borderRadius: 10,
            border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)",
            color: "#f59e0b", fontSize: 13, fontWeight: 800, cursor: "pointer",
            fontFamily: "var(--font-mono)", letterSpacing: 1.5, marginTop: 4,
            transition: "background 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.16)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(245,158,11,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
          >
            ACEITAR QUEST
          </button>
        </form>
      </div>
    </div>
  );
}
