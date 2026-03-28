"use client";

import { completeQuest, failQuest, deleteQuest, toggleSubTask } from "@/lib/actions";
import { ATTR_COLORS, ATTR_LABELS } from "@/lib/xp";
import { sfxComplete, sfxFail, sfxBossDefeat, sfxBossFail } from "@/lib/sounds";
import { CheckCircle2, XCircle, Trash2, Zap, Pencil, CheckSquare, Square, Clock } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import Link from "next/link";

function useResetCountdown() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    function calc() {
      const now = new Date();
      const next = new Date();
      next.setUTCHours(3, 0, 0, 0); // midnight BRT = 03:00 UTC
      if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
      setSecs(Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000)));
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface SubTask {
  id: string;
  title: string;
  done: boolean;
  order: number;
}

interface Quest {
  id: string;
  title: string;
  description: string | null;
  type: string;
  difficulty: string;
  attribute: string;
  xpReward: number;
  status: string;
  completedAt: Date | null;
  failedAt: Date | null;
  dueDate?: Date | null;
  subTasks?: SubTask[];
}

type AnimState = "idle" | "ok" | "fail";

const DIFF_COLORS: Record<string, string> = { EASY: "#22c55e", NORMAL: "#555", HARD: "#ef4444" };
const DIFF_MULT:   Record<string, number> = { EASY: 0.5, NORMAL: 1, HARD: 2 };
const DIFF_LABELS: Record<string, string> = { EASY: "EASY", NORMAL: "NORMAL", HARD: "HARD" };

function getDaysUntilDue(dueDate: Date | null | undefined): number | null {
  if (!dueDate) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export default function QuestCard({ quest }: { quest: Quest }) {
  const [pending, startTransition] = useTransition();
  const [anim, setAnim]            = useState<AnimState>("idle");
  const countdown                  = useResetCountdown();

  const color      = ATTR_COLORS[quest.attribute] || "#f59e0b";
  const isActive   = quest.status === "ACTIVE";
  const isCompleted = quest.status === "COMPLETED";
  const isFailed   = quest.status === "FAILED";
  const isBoss     = quest.type === "BOSS";

  // XP with multiplier
  const mult       = isBoss ? 3 : (DIFF_MULT[quest.difficulty] ?? 1);
  const effectiveXP = Math.round(quest.xpReward * mult);

  // Due date urgency (EPIC + BOSS only)
  const daysLeft   = quest.type !== "DAILY" ? getDaysUntilDue(quest.dueDate) : null;
  const isUrgent   = isActive && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  const isOverdue  = isActive && daysLeft !== null && daysLeft < 0;

  // Sub-tasks
  const subTasks   = quest.subTasks ?? [];
  const doneSubs   = subTasks.filter((s) => s.done).length;

  const handleOk = () => {
    setAnim("ok");
    isBoss ? sfxBossDefeat() : sfxComplete();
    setTimeout(() => startTransition(() => completeQuest(quest.id)), 420);
  };
  const handleFail = () => {
    setAnim("fail");
    isBoss ? sfxBossFail() : sfxFail();
    setTimeout(() => startTransition(() => failQuest(quest.id)), 420);
  };
  const handleDelete = () => startTransition(() => deleteQuest(quest.id));
  const handleToggleSub = (id: string) => startTransition(() => toggleSubTask(id));

  const urgentBorderColor = isOverdue
    ? "rgba(239,68,68,0.6)"
    : isUrgent
    ? "rgba(245,158,11,0.5)"
    : null;

  const cardStyle: React.CSSProperties = {
    background: isCompleted
      ? "rgba(34,197,94,0.04)"
      : isFailed
      ? "rgba(239,68,68,0.04)"
      : isBoss
      ? "rgba(239,68,68,0.03)"
      : "#111",
    border: `1px solid ${
      anim === "ok"
        ? "rgba(34,197,94,0.7)"
        : anim === "fail"
        ? "rgba(239,68,68,0.7)"
        : isCompleted
        ? "rgba(34,197,94,0.18)"
        : isFailed
        ? "rgba(239,68,68,0.18)"
        : urgentBorderColor ?? (isBoss ? "rgba(239,68,68,0.2)" : "#1f1f1f")
    }`,
    borderRadius: 10,
    padding: "15px 16px",
    opacity: pending ? 0.5 : 1,
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s, opacity 0.3s",
    animation:
      anim === "ok"
        ? "card-ok 0.42s ease forwards"
        : anim === "fail"
        ? "card-fail 0.42s ease forwards"
        : isUrgent
        ? "urgent-pulse 2s ease-in-out infinite"
        : undefined,
  };

  const statusColor = isCompleted ? "#22c55e" : isFailed ? "#ef4444" : "#444";
  const statusLabel = isCompleted ? "Concluída" : isFailed ? "Falhou" : "Ativa";

  return (
    <div style={cardStyle}>
      {/* Flash overlay */}
      {anim !== "idle" && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
          background: anim === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          animation: "fade-overlay 0.42s ease forwards",
        }} />
      )}

      <div className="quest-card-row">
        {/* Attribute badge */}
        <div style={{
          minWidth: 42, height: 42, borderRadius: 8, flexShrink: 0,
          background: `${color}12`, border: `1px solid ${color}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color, letterSpacing: 1,
        }}>
          {quest.attribute}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>
              {quest.title}
            </span>

            {/* Type badge */}
            <span style={{
              fontSize: 10, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, fontWeight: 600,
              background: isBoss ? "rgba(239,68,68,0.1)" : quest.type === "EPIC" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
              color: isBoss ? "#ef4444" : quest.type === "EPIC" ? "#f59e0b" : "#555",
              border: isBoss ? "1px solid rgba(239,68,68,0.2)" : quest.type === "EPIC" ? "1px solid rgba(245,158,11,0.2)" : "1px solid #1f1f1f",
            }}>
              {isBoss ? "☠ BOSS" : quest.type === "EPIC" ? "★ EPIC" : "DAILY"}
            </span>

            {/* Difficulty badge (skip NORMAL) */}
            {quest.difficulty && quest.difficulty !== "NORMAL" && (
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 4, letterSpacing: 1, fontWeight: 700,
                color: DIFF_COLORS[quest.difficulty] ?? "#555",
                background: `${DIFF_COLORS[quest.difficulty] ?? "#555"}12`,
                border: `1px solid ${DIFF_COLORS[quest.difficulty] ?? "#555"}28`,
              }}>
                {DIFF_LABELS[quest.difficulty]}
              </span>
            )}

            {/* Due date badge */}
            {daysLeft !== null && isActive && (
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5,
                color: isOverdue ? "#ef4444" : isUrgent ? "#f59e0b" : "#444",
                background: isOverdue ? "rgba(239,68,68,0.08)" : isUrgent ? "rgba(245,158,11,0.08)" : "transparent",
                border: isOverdue ? "1px solid rgba(239,68,68,0.2)" : isUrgent ? "1px solid rgba(245,158,11,0.2)" : "1px solid #1e1e1e",
              }}>
                {isOverdue ? `${Math.abs(daysLeft)}d atrasado` : daysLeft === 0 ? "hoje" : `${daysLeft}d restantes`}
              </span>
            )}
          </div>

          {quest.description && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555", lineHeight: 1.45 }}>
              {quest.description}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 7 }}>
            <span style={{ fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 3 }}>
              <Zap size={11} />
              {mult !== 1 && <span style={{ color: DIFF_COLORS[quest.difficulty] ?? "#ef4444", fontSize: 10 }}>×{mult}</span>}
              +{effectiveXP} XP
            </span>
            <span style={{ fontSize: 11, color: statusColor }}>● {statusLabel}</span>
            <span style={{ fontSize: 11, color: "#444" }}>{ATTR_LABELS[quest.attribute]}</span>
            {subTasks.length > 0 && (
              <span style={{ fontSize: 10, color: doneSubs === subTasks.length ? "#22c55e" : "#444" }}>
                {doneSubs}/{subTasks.length} tarefas
              </span>
            )}
            {quest.type === "DAILY" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#2a2a2a", marginLeft: "auto" }}>
                <Clock size={9} /> reset {countdown}
              </span>
            )}
          </div>

          {/* Sub-tasks */}
          {subTasks.length > 0 && isActive && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {subTasks.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleToggleSub(sub.id)}
                  disabled={pending}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "3px 0", textAlign: "left",
                  }}
                >
                  {sub.done
                    ? <CheckSquare size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                    : <Square size={13} color="#333" style={{ flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 12, color: sub.done ? "#444" : "#999", textDecoration: sub.done ? "line-through" : "none" }}>
                    {sub.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isActive && (
          <div className="quest-card-actions">
            <button
              onClick={handleOk}
              disabled={pending || anim !== "idle"}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 13px", borderRadius: 7,
                border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)",
                color: "#22c55e", fontSize: 12, cursor: "pointer",
                fontFamily: "var(--font-mono)", fontWeight: 700,
                transition: "transform 0.1s, box-shadow 0.15s",
                animation: anim === "ok" ? "btn-ok 0.42s ease forwards" : undefined,
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)")}
              onMouseUp={(e) =>   ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >
              <CheckCircle2 size={13} /> OK
            </button>

            {(quest.type === "DAILY" || quest.type === "BOSS") && (
              <button
                onClick={handleFail}
                disabled={pending || anim !== "idle"}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 13px", borderRadius: 7,
                  border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)",
                  color: "#ef4444", fontSize: 12, cursor: "pointer",
                  fontFamily: "var(--font-mono)", fontWeight: 700,
                  transition: "transform 0.1s",
                  animation: anim === "fail" ? "btn-fail 0.42s ease forwards" : undefined,
                }}
                onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)")}
                onMouseUp={(e) =>   ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              >
                <XCircle size={13} /> {isBoss ? "☠" : "Fail"}
              </button>
            )}
          </div>
        )}

        {/* Edit + Delete */}
        <div className="quest-card-actions-push" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <Link
            href={`/quests/${quest.id}/edit`}
            style={{
              padding: 8, borderRadius: 7, border: "1px solid #222",
              background: "#0d0d0d", color: "#555",
              flexShrink: 0, transition: "color 0.15s, border-color 0.15s",
              display: "flex", alignItems: "center",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#aaa"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "#333"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#555"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "#222"; }}
          >
            <Pencil size={14} />
          </Link>

          <button
            onClick={handleDelete}
            disabled={pending}
            style={{
              padding: 8, borderRadius: 7, border: "1px solid #222",
              background: "#0d0d0d", color: "#555",
              cursor: "pointer", flexShrink: 0, transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#555"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#222"; }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
