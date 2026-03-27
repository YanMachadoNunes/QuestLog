"use client";

import { updateQuest } from "@/lib/actions";
import { ATTR_COLORS, ATTR_LABELS } from "@/lib/xp";
import Link from "next/link";
import { ArrowLeft, Zap, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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

interface SubTask { id?: string; title: string; done?: boolean }
interface Quest {
  id: string; title: string; description: string | null;
  type: string; difficulty: string; attribute: string;
  xpReward: number; dueDate: string | null;
  subTasks: SubTask[];
}

export default function EditQuestPage() {
  const params  = useParams();
  const questId = params.id as string;

  const [quest,      setQuest]      = useState<Quest | null>(null);
  const [type,       setType]       = useState<QuestType>("DAILY");
  const [attr,       setAttr]       = useState("INT");
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [subTasks,   setSubTasks]   = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/quests/${questId}`)
      .then((r) => r.json())
      .then((data: Quest) => {
        setQuest(data);
        setType(data.type as QuestType);
        setAttr(data.attribute);
        setDifficulty((data.difficulty || "NORMAL") as Difficulty);
        setSubTasks(data.subTasks?.map((s) => s.title) ?? []);
      });
  }, [questId]);

  if (!quest) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ fontSize: 12, color: "#444" }}>Carregando...</div>
      </div>
    );
  }

  const showSubTasks = type === "EPIC" || type === "BOSS";

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 520, marginBottom: 20 }}>
        <Link href="/quests" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#444", textDecoration: "none" }}>
          <ArrowLeft size={12} /> voltar
        </Link>
      </div>

      <div className="animate-scale-in" style={{ width: "100%", maxWidth: 520, background: "#111", border: "1px solid #1f1f1f", borderRadius: 16, padding: "32px 36px" }}>
        <h1 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: "#e5e5e5" }}>Editar Quest</h1>

        <form action={updateQuest} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <input type="hidden" name="questId" value={questId} />

          {/* Type */}
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
                }}>
                  {meta.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="type" value={type} />
          </div>

          {/* Difficulty */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>Dificuldade</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {DIFF_META.map(({ key, label, color, mult }) => (
                <button key={key} type="button"
                  onClick={() => { if (type !== "BOSS") setDifficulty(key); }}
                  disabled={type === "BOSS"}
                  style={{
                    padding: "9px 6px", borderRadius: 9,
                    border: `1px solid ${difficulty === key && type !== "BOSS" ? `${color}40` : "#1a1a1a"}`,
                    background: difficulty === key && type !== "BOSS" ? `${color}10` : "#0d0d0d",
                    color: type === "BOSS" ? "#2a2a2a" : difficulty === key ? color : "#444",
                    fontSize: 11, fontWeight: 700, cursor: type === "BOSS" ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-mono)", letterSpacing: 0.5,
                  }}
                >
                  <div>{label}</div>
                  <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>×{type === "BOSS" ? 3 : mult}</div>
                </button>
              ))}
            </div>
            <input type="hidden" name="difficulty" value={type === "BOSS" ? "NORMAL" : difficulty} />
          </div>

          {/* Title */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>Título *</label>
            <input name="title" required defaultValue={quest.title} autoFocus
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#e5e5e5", fontSize: 13, fontFamily: "var(--font-mono)", outline: "none" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>Descrição</label>
            <textarea name="description" rows={2} defaultValue={quest.description ?? ""}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#e5e5e5", fontSize: 12, fontFamily: "var(--font-mono)", resize: "vertical", outline: "none" }}
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
                    fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)", textAlign: "left",
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{a}</div>
                    <div style={{ fontSize: 10, color: attr === a ? `${c}aa` : "#333" }}>{ATTR_LABELS[a]}</div>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="attribute" value={attr} />
          </div>

          {/* XP */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>XP Base</label>
            <div style={{ position: "relative" }}>
              <Zap size={13} color="#f59e0b" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input name="xpReward" type="number" min={10} max={9999} step={10} defaultValue={quest.xpReward}
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
              <input name="dueDate" type="date" defaultValue={quest.dueDate ?? ""}
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
                      onChange={(e) => { const next = [...subTasks]; next[i] = e.target.value; setSubTasks(next); }}
                      placeholder={`Etapa ${i + 1}`}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #1a1a1a", background: "#0d0d0d", color: "#e5e5e5", fontSize: 12, fontFamily: "var(--font-mono)", outline: "none" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
                    />
                    <button type="button" onClick={() => setSubTasks(subTasks.filter((_, j) => j !== i))}
                      style={{ padding: "0 10px", borderRadius: 8, border: "1px solid #1a1a1a", background: "transparent", color: "#333", cursor: "pointer", transition: "color 0.15s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#333")}
                    >
                      <X size={12} />
                    </button>
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

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="submit" style={{
              flex: 1, padding: "12px", borderRadius: 10,
              border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)",
              color: "#f59e0b", fontSize: 13, fontWeight: 800, cursor: "pointer",
              fontFamily: "var(--font-mono)", letterSpacing: 1,
            }}>SALVAR QUEST</button>
            <Link href="/quests" style={{
              padding: "12px 20px", borderRadius: 10, border: "1px solid #1a1a1a",
              background: "#0d0d0d", color: "#555", fontSize: 13, textDecoration: "none",
              fontFamily: "var(--font-mono)", display: "flex", alignItems: "center",
            }}>Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
