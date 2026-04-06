import { prisma } from "@/lib/prisma";
import {
  getCharacterLevel, ATTR_COLORS, ATTR_LABELS,
  CHAR_CLASSES, ATTR_CLASSES, getClass, isMilestoneLevel, getLevelInfo,
} from "@/lib/xp";
import AttributeCard from "@/components/AttributeCard";
import QuestCard from "@/components/QuestCard";
import StatBar from "@/components/StatBar";
import XPChart, { type DayXP } from "@/components/XPChart";
import ActivityCalendar, { type DayActivity } from "@/components/ActivityCalendar";
import ResetModal from "@/components/ResetModal";
import SleepButton from "@/components/SleepButton";
import EditableName from "@/components/EditableName";
import RankTheme from "@/components/RankTheme";
import { autoFailDailies, resetDailies, checkRest } from "@/lib/actions";
import {
  RefreshCw, Heart, Flame, Plus, Shield, Award, Star,
  Globe, Crown, Sparkles, ChevronUp, Minus, CheckCircle2, Circle, TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const RANK_ICONS: Record<string, React.ReactNode> = {
  D:          <Minus size={10} />,
  C:          <ChevronUp size={10} />,
  B:          <Shield size={10} />,
  A:          <Award size={11} />,
  S:          <Star size={12} fill="currentColor" />,
  Nacional:   <Globe size={12} />,
  Monarca:    <Crown size={13} fill="currentColor" />,
  Ascendente: <Sparkles size={13} />,
};

async function getWeeklyXP(): Promise<DayXP[]> {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    days.push(d);
  }
  const logs = await prisma.questLog.findMany({
    where: { action: "COMPLETED", createdAt: { gte: days[0] } },
    include: { quest: true },
  });
  return days.map((day, idx) => {
    const end = new Date(day); end.setHours(23,59,59,999);
    const dayLogs = logs.filter(l => new Date(l.createdAt) >= day && new Date(l.createdAt) <= end);
    const byAttr = { FRC: 0, INT: 0, CAR: 0, DES: 0, SAB: 0 };
    for (const l of dayLogs) {
      const a = l.quest.attribute as keyof typeof byAttr;
      if (a in byAttr) byAttr[a] += l.xpChange;
    }
    return {
      label: day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".","").slice(0,3).toUpperCase(),
      ...byAttr,
      total: Object.values(byAttr).reduce((a,b) => a+b, 0),
      isToday: idx === 6,
    };
  });
}

async function getActivityData(): Promise<{ data: DayActivity[]; totalXP: number }> {
  const start = new Date();
  start.setDate(start.getDate() - 16 * 7);
  start.setHours(0,0,0,0);
  const logs = await prisma.questLog.findMany({
    where: { action: "COMPLETED", createdAt: { gte: start } },
  });
  const map = new Map<string, number>();
  let total = 0;
  for (const log of logs) {
    const day = new Date(log.createdAt).toISOString().split("T")[0];
    map.set(day, (map.get(day) ?? 0) + log.xpChange);
    total += log.xpChange;
  }
  const data: DayActivity[] = Array.from(map.entries()).map(([date, xp]) => ({ date, xp }));
  return { data, totalXP: total };
}

function streakColor(n: number) {
  if (n >= 14) return "#ef4444";
  if (n >= 7)  return "#fb923c";
  if (n >= 3)  return "#f59e0b";
  return "#555";
}

export default async function Dashboard() {
  const failResult = await autoFailDailies();
  const restRegen  = await checkRest();

  const [character, attributes, quests, recentLogs, weeklyXP, activity, completedToday, totalDailiesCount] = await Promise.all([
    prisma.character.findFirst({ where: { isTest: false } }),
    prisma.attribute.findMany({ where: { type: { not: { endsWith: "_test" } } } }),
    prisma.quest.findMany({ where: { status: "ACTIVE" }, include: { subTasks: { orderBy: { order: "asc" } } }, take: 20 }),
    prisma.questLog.findMany({ include: { quest: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    getWeeklyXP(),
    getActivityData(),
    prisma.quest.count({ where: { type: "DAILY", status: "COMPLETED" } }),
    prisma.quest.count({ where: { type: "DAILY" } }),
  ]);

  const attrMap  = Object.fromEntries(attributes.map((a) => [a.type, a]));
  const allAttrs = ["FRC","INT","CAR","DES","SAB"].map(t => attrMap[t] || { type: t, xp: 0, level: 1 });
  const charLevel = getCharacterLevel(allAttrs.map(a => a.level));
  const totalXP   = allAttrs.reduce((s, a) => s + a.xp, 0);
  const charClass = getClass(CHAR_CLASSES, charLevel);
  const milestone = isMilestoneLevel(charLevel);
  const dailies   = quests.filter(q => q.type === "DAILY");
  const epics     = quests.filter(q => q.type === "EPIC");
  const bosses    = quests.filter(q => q.type === "BOSS");
  const hp     = character?.hp ?? 100;
  const maxHp  = character?.maxHp ?? 100;
  const hpPct  = Math.round((hp / maxHp) * 100);
  const hpColor = hpPct <= 25 ? "#ef4444" : hpPct <= 50 ? "#f59e0b" : "#22c55e";
  const streak  = character?.streak ?? 0;
  const hasXP   = weeklyXP.some(d => d.total > 0);
  const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="animate-float-in">
      <RankTheme color={charClass.color} />

      {/* ── Auto-fail banner ──────────────────────────── */}
      {failResult.failedCount > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.16)",
          borderLeft: "3px solid rgba(239,68,68,0.5)",
          borderRadius: 8, padding: "10px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10, fontSize: 12,
        }}>
          <span style={{ fontSize: 16 }}>💀</span>
          <div>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>
              {failResult.failedCount} {failResult.failedCount !== 1 ? "dailies falharam" : "daily falhou"} ontem
            </span>
            <span style={{ color: "#444" }}>
              {failResult.hpLost > 0 && ` · -${failResult.hpLost} HP`}
              {failResult.streakBroken && " · streak resetado"}
            </span>
          </div>
        </div>
      )}

      {/* ── Page header ───────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#e5e5e5", letterSpacing: 0.3 }}>
            Hoje
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#333", textTransform: "capitalize" }}>
            {todayLabel}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {streak > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20,
              background: `${streakColor(streak)}0a`,
              border: `1px solid ${streakColor(streak)}25`,
              animation: streak >= 7 ? "glow-pulse 3s ease-in-out infinite" : undefined,
            }}>
              <span style={{ fontSize: 14 }}>{streak >= 14 ? "🔥" : streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "✨"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: streakColor(streak) }}>{streak}</span>
            </div>
          )}
          <Link href="/quests/new" style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            borderRadius: 7, border: "1px solid rgba(245,158,11,0.2)",
            background: "rgba(245,158,11,0.06)", color: "#f59e0b",
            fontSize: 11, fontWeight: 700, textDecoration: "none",
            fontFamily: "var(--font-mono)", letterSpacing: 0.5,
          }}>
            <Plus size={12} /> Nova Quest
          </Link>
        </div>
      </div>

      {/* ── Today progress bar ────────────────────────── */}
      {totalDailiesCount > 0 && (
        <div style={{
          background: "#111", border: "1px solid #1c1c1c", borderRadius: 10,
          padding: "14px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: "#444", display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} color={completedToday === totalDailiesCount ? "#22c55e" : "#333"} />
                Dailies hoje
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: completedToday === totalDailiesCount ? "#22c55e" : "#555",
              }}>
                {completedToday} / {totalDailiesCount}
              </span>
            </div>
            <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.round((completedToday / totalDailiesCount) * 100)}%`,
                background: completedToday === totalDailiesCount
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : "linear-gradient(90deg, #22d3ee, #60a5fa)",
                borderRadius: 3,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
          {completedToday === totalDailiesCount && (
            <span style={{ fontSize: 18 }}>🎉</span>
          )}
        </div>
      )}

      {/* ── Dailies ───────────────────────────────────── */}
      {dailies.length > 0 ? (
        <Section label="Dailies" count={dailies.length} accent="#22d3ee">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dailies.map((q, i) => (
              <div key={q.id} className="animate-slide-right" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
          </div>
        </Section>
      ) : totalDailiesCount === 0 ? (
        <div style={{
          background: "#111", border: "1px solid #1c1c1c", borderRadius: 10,
          padding: "28px 20px", marginBottom: 28, textAlign: "center",
        }}>
          <Circle size={32} color="#1e1e1e" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 12, color: "#333", marginBottom: 12 }}>Nenhuma daily criada ainda.</p>
          <Link href="/quests/new" style={{
            fontSize: 11, color: "#f59e0b", fontWeight: 700, textDecoration: "none",
            padding: "7px 14px", borderRadius: 6,
            border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.06)",
          }}>
            + Criar primeira daily
          </Link>
        </div>
      ) : null}

      {/* ── Epics ─────────────────────────────────────── */}
      {epics.length > 0 && (
        <Section label="Epics" count={epics.length} accent="#f59e0b">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {epics.map((q, i) => (
              <div key={q.id} className="animate-slide-right" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Bosses ────────────────────────────────────── */}
      {bosses.length > 0 && (
        <Section label="Boss Quests" count={bosses.length} accent="#ef4444">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {bosses.map((q, i) => (
              <div key={q.id} className="animate-slide-right" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Character card ──────────────────────────── */}
      <Section label="Personagem">
        <div style={{
          background: "#111", border: "1px solid #1c1c1c", borderRadius: 14,
          overflow: "hidden",
        }}>
          {/* ── Identity band ── */}
          <div style={{
            padding: "22px 24px 20px",
            background: `linear-gradient(135deg, ${charClass.color}0a 0%, transparent 55%)`,
            borderBottom: "1px solid #171717",
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            position: "relative", overflow: "hidden",
          }}>
            {/* Background orb */}
            <div style={{
              position: "absolute", top: -60, right: -60, width: 200, height: 200,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${charClass.color}07 0%, transparent 65%)`,
              pointerEvents: "none",
            }} />

            {/* Avatar with level badge */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%",
                background: `${charClass.color}10`,
                border: `2px solid ${charClass.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
                boxShadow: `0 0 28px ${charClass.color}18, inset 0 0 14px ${charClass.color}06`,
                animation: "glow-pulse 3s ease-in-out infinite",
              }}>⚔</div>
              {/* Level overlay badge */}
              <div style={{
                position: "absolute", bottom: -3, right: -3,
                width: 24, height: 24, borderRadius: "50%",
                background: charClass.color,
                border: "2px solid #111",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, color: "#000",
                boxShadow: `0 0 8px ${charClass.color}60`,
              }}>
                {charLevel}
              </div>
            </div>

            {/* Name + rank */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <EditableName name={character?.name ?? "Aventureiro"} />
                {/* Rank badge */}
                {charClass.name === "Ascendente" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6,
                    background: "linear-gradient(90deg, #e879f918, #f59e0b18, #60a5fa18, #e879f918)",
                    backgroundSize: "300% 100%",
                    boxShadow: "0 0 16px #e879f966",
                    color: "#f0e6ff", fontSize: 10, fontWeight: 900, letterSpacing: 2,
                    textShadow: "0 0 10px #e879f9",
                    animation: "ascendente-pulse 3s ease-in-out infinite",
                    ["--rank-color" as string]: "#e879f966",
                    ["--rank-color-faint" as string]: "#e879f922",
                  }}>
                    {RANK_ICONS["Ascendente"]} ASCENDENTE
                  </span>
                ) : charClass.name === "Monarca" ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 11px", borderRadius: 6,
                    background: `${charClass.color}15`, border: `2px solid ${charClass.color}60`,
                    color: charClass.color, fontSize: 10, fontWeight: 900, letterSpacing: 2,
                    textShadow: `0 0 10px ${charClass.color}cc`,
                    animation: "rank-intense 2s ease-in-out infinite",
                    ["--rank-color" as string]: `${charClass.color}80`,
                    ["--rank-color-faint" as string]: `${charClass.color}25`,
                  }}>
                    {RANK_ICONS["Monarca"]} MONARCA
                  </span>
                ) : (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 9px", borderRadius: 5,
                    background: `${charClass.color}0e`,
                    border: `1px solid ${charClass.color}${charClass.minLevel >= 20 ? "45" : "28"}`,
                    color: charClass.color, fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                    boxShadow: charClass.minLevel >= 20 ? `0 0 10px ${charClass.color}30` : undefined,
                    animation: charClass.minLevel >= 20 ? "rank-glow 2s ease-in-out infinite" : undefined,
                    ["--rank-color" as string]: `${charClass.color}55`,
                    ["--rank-color-faint" as string]: `${charClass.color}15`,
                  }}>
                    {RANK_ICONS[charClass.name]} {charClass.name}
                  </span>
                )}
                {streak > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, padding: "3px 9px", borderRadius: 20,
                    background: `${streakColor(streak)}0d`, border: `1px solid ${streakColor(streak)}28`,
                    color: streakColor(streak), fontWeight: 700,
                    animation: streak >= 7 ? "glow-pulse 2.5s ease-in-out infinite" : undefined,
                  }}>
                    <Flame size={10} /> {streak}d
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#383838" }}>
                Nível {charLevel} · {charClass.name}
              </div>
            </div>

            {/* Total XP */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 2, marginBottom: 3 }}>XP TOTAL</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b", lineHeight: 1 }}>
                {totalXP.toLocaleString()}
              </div>
            </div>
          </div>

          {/* ── HP ── */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #171717" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "#444", display: "flex", alignItems: "center", gap: 5 }}>
                <Heart size={11} color={hpColor} fill={hpPct <= 25 ? hpColor : "none"} />
                PONTOS DE VIDA
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: hpColor, lineHeight: 1 }}>{hp}</span>
                <span style={{ fontSize: 11, color: "#2e2e2e" }}>/ {maxHp}</span>
                <span style={{ fontSize: 10, color: "#2e2e2e", marginLeft: 4 }}>({hpPct}%)</span>
              </div>
            </div>
            <div style={{ height: 10, background: "#181818", borderRadius: 6, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%", width: `${hpPct}%`,
                background: `linear-gradient(90deg, ${hpColor}88, ${hpColor})`,
                borderRadius: 6,
                transition: "width 0.7s ease",
                boxShadow: `0 0 12px ${hpColor}50`,
              }} />
              {/* Tick marks every 25% */}
              {[25, 50, 75].map(pct => (
                <div key={pct} style={{
                  position: "absolute", top: 0, bottom: 0,
                  left: `${pct}%`, width: 1,
                  background: "rgba(0,0,0,0.4)",
                }} />
              ))}
            </div>
            {restRegen > 0 ? (
              <div style={{ fontSize: 10, color: "#22c55e", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <span>💤</span> Descansou · <strong>+{restRegen} HP recuperado</strong>
              </div>
            ) : character?.sleepAt ? (
              <div style={{ fontSize: 10, color: "#22d3ee", marginTop: 6 }}>💤 Dormindo…</div>
            ) : hpPct <= 25 ? (
              <div style={{ fontSize: 10, color: "#ef4444", marginTop: 6 }}>⚠ HP crítico — durma para recuperar</div>
            ) : hp < maxHp ? (
              <div style={{ fontSize: 10, color: "#2e2e2e", marginTop: 6 }}>Durma para recuperar HP</div>
            ) : (
              <div style={{ fontSize: 10, color: "#22c55e", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                ✓ HP completo
              </div>
            )}
          </div>

          {/* ── Stats grid ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            borderBottom: "1px solid #171717",
          }}>
            {[
              { value: totalXP.toLocaleString(), label: "XP Total",  color: "#f59e0b" },
              { value: charLevel,                label: "Nível",      color: charClass.color },
              { value: streak > 0 ? `${streak}🔥` : "—", label: "Streak", color: streakColor(streak) },
              { value: dailies.length + epics.length + bosses.length, label: "Quests ativas", color: "#22d3ee" },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: "14px 10px", textAlign: "center",
                borderRight: i < 3 ? "1px solid #171717" : "none",
                background: "transparent",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 9, color: "#2e2e2e", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Attributes grid ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
            borderBottom: "1px solid #171717",
          }}>
            {allAttrs.map((attr, i) => {
              const color   = ATTR_COLORS[attr.type];
              const cls     = getClass(ATTR_CLASSES[attr.type] || [], attr.level);
              const { progress } = getLevelInfo(attr.xp);
              const EMOJI: Record<string, string> = { FRC:"💪", INT:"⚡", CAR:"🗣", DES:"🎯", SAB:"📖" };
              return (
                <div key={attr.type} style={{
                  padding: "14px 8px 12px",
                  borderRight: i < 4 ? "1px solid #171717" : "none",
                  textAlign: "center",
                  background: `linear-gradient(180deg, ${color}04 0%, transparent 100%)`,
                }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{EMOJI[attr.type]}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.5, marginBottom: 2 }}>
                    {attr.type}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1, marginBottom: 2 }}>
                    {attr.level}
                  </div>
                  <div style={{ fontSize: 8, color: "#3a3a3a", marginBottom: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {cls.name}
                  </div>
                  {/* Mini XP bar */}
                  <div style={{ height: 3, background: "#1e1e1e", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${progress}%`,
                      background: `linear-gradient(90deg, ${color}66, ${color})`,
                      borderRadius: 2,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 8, color: "#252525", marginTop: 3 }}>{progress}%</div>
                </div>
              );
            })}
          </div>

          {/* ── Actions ── */}
          <div style={{ padding: "14px 20px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <SleepButton sleepAt={character?.sleepAt ?? null} />
            <form action={resetDailies}>
              <button type="submit" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 7,
                border: "1px solid #1e1e1e", background: "#0d0d0d",
                color: "#444", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)",
                transition: "color 0.15s, border-color 0.15s",
              }}>
                <RefreshCw size={11} /> Reset Dailies
              </button>
            </form>
            <ResetModal />
          </div>
        </div>
      </Section>

      {/* ── Progress ──────────────────────────────────── */}
      <Section label="Progresso" icon={<TrendingUp size={12} color="#555" />}>
        {/* XP semanal */}
        {hasXP ? (
          <XPChart data={weeklyXP} />
        ) : (
          <div style={{
            background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12,
            padding: "32px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.2 }}>📊</div>
            <div style={{ fontSize: 11, color: "#252525" }}>Complete quests para ver o gráfico semanal.</div>
          </div>
        )}

        {/* Calendário de atividade */}
        <div style={{
          marginTop: 14,
          background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12,
          padding: "20px 20px 16px",
          overflow: "hidden",
        }}>
          <ActivityCalendar data={activity.data} totalXP={activity.totalXP} />
        </div>
      </Section>

      {/* ── Atributos ─────────────────────────────────── */}
      <Section label="Atributos">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {allAttrs.map((attr, i) => (
            <div key={attr.type} className="animate-float-in" style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}>
              <AttributeCard type={attr.type} xp={attr.xp} level={attr.level} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Atividade recente ─────────────────────────── */}
      {recentLogs.length > 0 && (
        <Section label="Atividade recente">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recentLogs.map((log, i) => {
              const ok = log.action === "COMPLETED";
              return (
                <div key={log.id} className="animate-float-in" style={{
                  animationDelay: `${i * 0.03}s`, opacity: 0,
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px",
                  background: "#111",
                  border: `1px solid ${ok ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)"}`,
                  borderLeft: `2px solid ${ok ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                  borderRadius: 7, fontSize: 11,
                }}>
                  <span style={{ color: ok ? "#22c55e" : "#ef4444", fontWeight: 700, minWidth: 12 }}>{ok ? "✓" : "✗"}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ATTR_COLORS[log.quest.attribute], minWidth: 26, letterSpacing: 1 }}>{log.quest.attribute}</span>
                  <span style={{ flex: 1, color: "#999" }}>{log.quest.title}</span>
                  {log.xpChange  > 0 && <span style={{ color: "#f59e0b", fontSize: 10 }}>+{log.xpChange} XP</span>}
                  {log.hpChange !== 0 && (
                    <span style={{ color: log.hpChange > 0 ? "#22c55e" : "#ef4444", fontSize: 10 }}>
                      {log.hpChange > 0 ? "+" : ""}{log.hpChange} HP
                    </span>
                  )}
                  <span style={{ color: "#1e1e1e", fontSize: 9 }}>{new Date(log.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  label, children, count, accent, icon,
}: {
  label: string;
  children: React.ReactNode;
  count?: number;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, color: "#2e2e2e", letterSpacing: 2, textTransform: "uppercase" }}>
          {label}
        </span>
        {count !== undefined && (
          <span style={{
            fontSize: 9, padding: "1px 7px", borderRadius: 10, fontWeight: 700,
            background: accent ? `${accent}0d` : "#141414",
            border: `1px solid ${accent ? accent + "20" : "#1e1e1e"}`,
            color: accent ?? "#444",
          }}>
            {count}
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: "#141414" }} />
      </div>
      {children}
    </div>
  );
}
