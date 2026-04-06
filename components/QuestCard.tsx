"use client";

import { completeQuest, failQuest, deleteQuest, toggleSubTask } from "@/lib/actions";
import { ATTR_COLORS, ATTR_LABELS } from "@/lib/xp";
import { sfxComplete, sfxFail, sfxBossDefeat, sfxBossFail } from "@/lib/sounds";
import { XCircle, Trash2, Zap, Pencil, CheckSquare, Square, Clock, Check, Skull } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import Link from "next/link";

function useResetCountdown() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    function calc() {
      const now = new Date();
      const next = new Date();
      next.setUTCHours(3, 0, 0, 0);
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
type DeleteState = "idle" | "confirm";

const DIFF_COLORS: Record<string, string> = { EASY: "#22c55e", NORMAL: "#555", HARD: "#ef4444" };
const DIFF_MULT:   Record<string, number> = { EASY: 0.5, NORMAL: 1, HARD: 2 };

function getDaysUntilDue(dueDate: Date | null | undefined): number | null {
  if (!dueDate) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export default function QuestCard({ quest }: { quest: Quest }) {
  const [pending, startTransition] = useTransition();
  const [anim, setAnim]            = useState<AnimState>("idle");
  const [deleteState, setDeleteState] = useState<DeleteState>("idle");
  const [xpFloat, setXpFloat]      = useState(false);
  const [checkHover, setCheckHover] = useState(false);
  const countdown                  = useResetCountdown();

  const color      = ATTR_COLORS[quest.attribute] || "#f59e0b";
  const isActive   = quest.status === "ACTIVE";
  const isCompleted = quest.status === "COMPLETED";
  const isFailed   = quest.status === "FAILED";
  const isBoss     = quest.type === "BOSS";

  const mult        = isBoss ? 3 : (DIFF_MULT[quest.difficulty] ?? 1);
  const effectiveXP = Math.round(quest.xpReward * mult);

  const daysLeft  = quest.type !== "DAILY" ? getDaysUntilDue(quest.dueDate) : null;
  const isUrgent  = isActive && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  const isOverdue = isActive && daysLeft !== null && daysLeft < 0;

  const subTasks = quest.subTasks ?? [];
  const doneSubs = subTasks.filter((s) => s.done).length;

  const handleOk = () => {
    if (!isActive || anim !== "idle") return;
    setAnim("ok");
    setXpFloat(true);
    setTimeout(() => setXpFloat(false), 900);
    isBoss ? sfxBossDefeat() : sfxComplete();
    setTimeout(() => startTransition(() => completeQuest(quest.id)), 420);
  };
  const handleFail = () => {
    setAnim("fail");
    isBoss ? sfxBossFail() : sfxFail();
    setTimeout(() => startTransition(() => failQuest(quest.id)), 420);
  };
  const handleDelete = () => {
    if (deleteState === "idle") {
      setDeleteState("confirm");
      setTimeout(() => setDeleteState("idle"), 3000);
      return;
    }
    startTransition(() => deleteQuest(quest.id));
  };
  const handleToggleSub = (id: string) => startTransition(() => toggleSubTask(id));

  // Derive card state
  const urgentBorder = isOverdue
    ? "rgba(239,68,68,0.45)"
    : isUrgent
    ? "rgba(245,158,11,0.35)"
    : null;

  const cardBorderColor =
    anim === "ok"   ? "rgba(34,197,94,0.6)" :
    anim === "fail" ? "rgba(239,68,68,0.6)" :
    isCompleted     ? "rgba(34,197,94,0.12)" :
    isFailed        ? "rgba(239,68,68,0.12)" :
    urgentBorder    ?? (isBoss ? "rgba(239,68,68,0.15)" : "#1c1c1c");

  const cardAnim =
    anim === "ok"            ? "card-ok 0.42s ease forwards" :
    anim === "fail"          ? "card-fail 0.42s ease forwards" :
    isUrgent                 ? "urgent-pulse 2s ease-in-out infinite" :
    isBoss && isActive       ? "boss-pulse 3s ease-in-out infinite" :
    undefined;

  // Checkbox / completion button
  const checkBg =
    isCompleted          ? "#22c55e" :
    isFailed             ? "#ef4444" :
    checkHover && isActive ? `${color}22` :
    "transparent";

  const checkBorderColor =
    isCompleted            ? "#22c55e" :
    isFailed               ? "#ef4444" :
    checkHover && isActive ? color :
    "#2a2a2a";

  return (
    <div style={{
      background: isCompleted ? "rgba(34,197,94,0.025)" : isFailed ? "rgba(239,68,68,0.025)" : isBoss ? "rgba(239,68,68,0.02)" : "#111",
      border: `1px solid ${cardBorderColor}`,
      borderLeft: `3px solid ${isCompleted ? "#22c55e55" : isFailed ? "#ef444455" : color + "55"}`,
      borderRadius: 10,
      padding: "13px 14px",
      opacity: pending ? 0.5 : 1,
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s, opacity 0.3s",
      animation: cardAnim,
    }}>
      {/* Flash overlay */}
      {anim !== "idle" && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
          background: anim === "ok" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
          animation: "fade-overlay 0.42s ease forwards",
        }} />
      )}

      {/* Floating XP */}
      {xpFloat && (
        <div style={{
          position: "absolute", top: "20%", right: 100,
          fontSize: 14, fontWeight: 900,
          color: color,
          textShadow: `0 0 10px ${color}80`,
          animation: "xp-float 0.9s ease forwards",
          pointerEvents: "none", zIndex: 10,
          letterSpacing: 0.5,
        }}>
          +{effectiveXP} XP
        </div>
      )}

      <div className="quest-card-row">
        {/* Checkbox / Complete button */}
        <button
          onClick={handleOk}
          disabled={!isActive || pending || anim !== "idle"}
          onMouseEnter={() => isActive && setCheckHover(true)}
          onMouseLeave={() => setCheckHover(false)}
          title={isActive ? "Completar" : undefined}
          style={{
            width: 22, height: 22, borderRadius: "50%",
            border: `2px solid ${checkBorderColor}`,
            background: checkBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isActive ? "pointer" : "default",
            flexShrink: 0,
            marginTop: 1,
            transition: "border-color 0.15s, background 0.15s",
            animation: anim === "ok" ? "btn-ok 0.42s ease forwards" : undefined,
          }}
        >
          {isCompleted ? (
            <Check size={12} color="#fff" strokeWidth={3} style={{ animation: "check-pop 0.3s ease forwards" }} />
          ) : isFailed ? (
            <XCircle size={11} color="#fff" />
          ) : checkHover ? (
            <Check size={11} color={color} strokeWidth={2.5} />
          ) : null}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isCompleted || isFailed ? "#444" : "#d5d5d5",
              textDecoration: isCompleted ? "line-through" : isFailed ? "line-through" : "none",
              textDecorationColor: "#333",
            }}>
              {quest.title}
            </span>

            {/* Type badge */}
            <span style={{
              fontSize: 9, padding: "2px 6px", borderRadius: 4, letterSpacing: 1, fontWeight: 700,
              background: isBoss ? "rgba(239,68,68,0.1)" : quest.type === "EPIC" ? "rgba(245,158,11,0.08)" : `${color}08`,
              color: isBoss ? "#ef4444" : quest.type === "EPIC" ? "#f59e0b" : color,
              border: isBoss ? "1px solid rgba(239,68,68,0.18)" : quest.type === "EPIC" ? "1px solid rgba(245,158,11,0.18)" : `1px solid ${color}18`,
            }}>
              {isBoss ? "☠ BOSS" : quest.type === "EPIC" ? "★ EPIC" : "DAILY"}
            </span>

            {/* Difficulty badge */}
            {quest.difficulty && quest.difficulty !== "NORMAL" && (
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 4, letterSpacing: 1, fontWeight: 700,
                color: DIFF_COLORS[quest.difficulty] ?? "#555",
                background: `${DIFF_COLORS[quest.difficulty] ?? "#555"}0a`,
                border: `1px solid ${DIFF_COLORS[quest.difficulty] ?? "#555"}20`,
              }}>
                {quest.difficulty}
              </span>
            )}

            {/* Boss sem prazo */}
            {isBoss && !quest.dueDate && isActive && (
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, color: "#f59e0b", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
                ⚠ sem prazo
              </span>
            )}

            {/* Due date */}
            {daysLeft !== null && isActive && (
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.3,
                color: isOverdue ? "#ef4444" : isUrgent ? "#f59e0b" : "#3a3a3a",
                background: isOverdue ? "rgba(239,68,68,0.07)" : isUrgent ? "rgba(245,158,11,0.07)" : "transparent",
                border: isOverdue ? "1px solid rgba(239,68,68,0.18)" : isUrgent ? "1px solid rgba(245,158,11,0.18)" : "1px solid #1c1c1c",
              }}>
                {isOverdue ? `${Math.abs(daysLeft)}d atrasado` : daysLeft === 0 ? "hoje" : `${daysLeft}d`}
              </span>
            )}
          </div>

          {/* Description */}
          {quest.description && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444", lineHeight: 1.5 }}>
              {quest.description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#f59e0b", display: "flex", alignItems: "center", gap: 3 }}>
              <Zap size={10} />
              {mult !== 1 && <span style={{ color: DIFF_COLORS[quest.difficulty] ?? "#ef4444", fontSize: 9 }}>×{mult} </span>}
              +{effectiveXP} XP
            </span>
            <span style={{ fontSize: 10, color: color + "aa", display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
              {ATTR_LABELS[quest.attribute] ?? quest.attribute}
            </span>
            {subTasks.length > 0 && (
              <span style={{ fontSize: 10, color: doneSubs === subTasks.length ? "#22c55e" : "#3a3a3a" }}>
                {doneSubs}/{subTasks.length} tarefas
              </span>
            )}
            {quest.type === "DAILY" && isActive && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: "#2a2a2a", marginLeft: "auto" }}>
                <Clock size={9} /> {countdown}
              </span>
            )}
          </div>

          {/* Sub-task progress bar */}
          {subTasks.length > 0 && (
            <div style={{ marginTop: 7, height: 2, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.round((doneSubs / subTasks.length) * 100)}%`,
                background: doneSubs === subTasks.length ? "#22c55e" : color,
                borderRadius: 2,
                transition: "width 0.4s ease",
              }} />
            </div>
          )}

          {/* Sub-tasks */}
          {subTasks.length > 0 && isActive && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {subTasks.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleToggleSub(sub.id)}
                  disabled={pending}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px 0", textAlign: "left",
                  }}
                >
                  {sub.done
                    ? <CheckSquare size={12} color="#22c55e" style={{ flexShrink: 0 }} />
                    : <Square size={12} color="#2e2e2e" style={{ flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 11, color: sub.done ? "#3a3a3a" : "#888", textDecoration: sub.done ? "line-through" : "none" }}>
                    {sub.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side: fail + edit + delete */}
        <div className="quest-card-actions quest-card-actions-push" style={{ alignSelf: "flex-start" }}>
          {/* Fail button (DAILY + BOSS only) */}
          {isActive && (quest.type === "DAILY" || quest.type === "BOSS") && (
            <button
              onClick={handleFail}
              disabled={pending || anim !== "idle"}
              title={isBoss ? "Falhou" : "Fail"}
              style={{
                padding: "6px 10px", borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)",
                color: "#ef444470", fontSize: 11, cursor: "pointer",
                fontFamily: "var(--font-mono)", fontWeight: 700,
                transition: "color 0.15s, border-color 0.15s, background 0.15s",
                display: "flex", alignItems: "center", gap: 4,
                animation: anim === "fail" ? "btn-fail 0.42s ease forwards" : undefined,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#ef444470";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.2)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.05)";
              }}
            >
              {isBoss ? <Skull size={11} /> : <XCircle size={11} />}
            </button>
          )}

          <Link
            href={`/quests/${quest.id}/edit`}
            style={{
              padding: 7, borderRadius: 6, border: "1px solid #1e1e1e",
              background: "#0d0d0d", color: "#3a3a3a",
              flexShrink: 0, display: "flex", alignItems: "center",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#888";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#333";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#3a3a3a";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1e1e1e";
            }}
          >
            <Pencil size={12} />
          </Link>

          <button
            onClick={handleDelete}
            disabled={pending}
            style={{
              padding: deleteState === "confirm" ? "5px 8px" : 7,
              borderRadius: 6,
              border: deleteState === "confirm" ? "1px solid rgba(239,68,68,0.45)" : "1px solid #1e1e1e",
              background: deleteState === "confirm" ? "rgba(239,68,68,0.08)" : "#0d0d0d",
              color: deleteState === "confirm" ? "#ef4444" : "#3a3a3a",
              cursor: "pointer", flexShrink: 0,
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 10, fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (deleteState === "idle") {
                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (deleteState === "idle") {
                (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e1e1e";
              }
            }}
          >
            {deleteState === "confirm" ? <>confirmar?</> : <Trash2 size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}
