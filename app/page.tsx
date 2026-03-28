import { prisma } from "@/lib/prisma";
import {
  getCharacterLevel, ATTR_COLORS,
  CHAR_CLASSES, ATTR_CLASSES, getClass, isMilestoneLevel,
} from "@/lib/xp";
import AttributeCard from "@/components/AttributeCard";
import QuestCard from "@/components/QuestCard";
import StatBar from "@/components/StatBar";
import XPChart, { type DayXP } from "@/components/XPChart";
import ActivityCalendar, { type DayActivity } from "@/components/ActivityCalendar";
import ResetModal from "@/components/ResetModal";
import { autoFailDailies, resetDailies, checkRest } from "@/lib/actions";
import { RefreshCw, Heart, Flame, Plus, Shield, ShieldCheck, Star, Globe, Crown, Sparkles, ChevronUp, Minus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const RANK_ICONS: Record<string, React.ReactNode> = {
  D:          <Minus size={11} />,
  C:          <ChevronUp size={11} />,
  B:          <Shield size={11} />,
  A:          <ShieldCheck size={12} />,
  S:          <Star size={13} fill="currentColor" />,
  Nacional:   <Globe size={13} />,
  Monarca:    <Crown size={14} fill="currentColor" />,
  Ascendente: <Sparkles size={14} />,
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
  await autoFailDailies();
  const restRegen = await checkRest();

  const [character, attributes, quests, recentLogs, weeklyXP, activity] = await Promise.all([
    prisma.character.findFirst({ where: { isTest: false } }),
    prisma.attribute.findMany({ where: { type: { not: { endsWith: "_test" } } } }),
    prisma.quest.findMany({ where: { status: "ACTIVE" }, include: { subTasks: { orderBy: { order: "asc" } } }, take: 20 }),
    prisma.questLog.findMany({ include: { quest: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    getWeeklyXP(),
    getActivityData(),
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

  // Rest state (computed server-side)
  const lastActive     = character?.lastActiveDate ? new Date(character.lastActiveDate) : null;
  const hoursSinceActive = lastActive ? (Date.now() - lastActive.getTime()) / 3_600_000 : 999;
  const isResting      = hoursSinceActive >= 8;
  const hoursUntilRest = isResting ? 0 : Math.ceil(8 - hoursSinceActive);
  const nextRegen      = hoursSinceActive >= 24 ? 35 : hoursSinceActive >= 16 ? 25 : 15;

  return (
    <div className="animate-float-in">

      {/* ── Header ────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5", letterSpacing: 0.5 }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#444" }}>Status do personagem e missões ativas</p>
        </div>
        <Link href="/quests/new" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)",
          background: "rgba(245,158,11,0.07)", color: "#f59e0b",
          fontSize: 12, fontWeight: 700, textDecoration: "none",
          fontFamily: "var(--font-mono)", letterSpacing: 0.5,
        }}>
          <Plus size={13} /> Nova Quest
        </Link>
      </div>

      {/* ── Character card ────────────────────────────── */}
      <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 14, padding: "22px 24px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${charClass.color}07 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: 60, height: 60, borderRadius: "50%", flexShrink: 0, background: `${charClass.color}10`, border: `2px solid ${charClass.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, animation: "glow-pulse 3s ease-in-out infinite" }}>⚔</div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#e5e5e5" }}>{character?.name ?? "Aventureiro"}</span>
              <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: `${charClass.color}10`, border: `1px solid ${charClass.color}28`, color: charClass.color, fontWeight: 700, letterSpacing: 1 }}>
                Lv. {charLevel}
              </span>
              {/* RANK BADGE */}
              {charClass.name === "Ascendente" ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 13px", borderRadius: 8, whiteSpace: "nowrap",
                  background: "linear-gradient(90deg, #e879f918, #f59e0b18, #60a5fa18, #e879f918)",
                  backgroundSize: "300% 100%",
                  border: "1.5px solid transparent",
                  backgroundClip: "padding-box",
                  outline: "1.5px solid transparent",
                  boxShadow: "0 0 20px #e879f966, 0 0 40px #f59e0b44",
                  color: "#f0e6ff",
                  fontSize: 12, fontWeight: 900, letterSpacing: 2,
                  textTransform: "uppercase",
                  textShadow: "0 0 12px #e879f9, 0 0 24px #f59e0b88",
                  animation: "ascendente-pulse 3s ease-in-out infinite",
                  ["--rank-color" as string]: "#e879f966",
                  ["--rank-color-faint" as string]: "#e879f922",
                }}>
                  {RANK_ICONS["Ascendente"]} ASCENDENTE
                </span>
              ) : charClass.name === "Monarca" ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap",
                  background: `${charClass.color}18`,
                  border: `2px solid ${charClass.color}70`,
                  color: charClass.color,
                  fontSize: 12, fontWeight: 900, letterSpacing: 2,
                  textTransform: "uppercase",
                  textShadow: `0 0 14px ${charClass.color}cc`,
                  animation: "rank-intense 2s ease-in-out infinite",
                  ["--rank-color" as string]: `${charClass.color}80`,
                  ["--rank-color-faint" as string]: `${charClass.color}25`,
                }}>
                  {RANK_ICONS["Monarca"]} MONARCA
                </span>
              ) : charClass.name === "Nacional" ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap",
                  background: `${charClass.color}15`,
                  border: `2px solid ${charClass.color}60`,
                  color: charClass.color,
                  fontSize: 12, fontWeight: 900, letterSpacing: 2,
                  textTransform: "uppercase",
                  textShadow: `0 0 12px ${charClass.color}aa`,
                  animation: "rank-intense 2.5s ease-in-out infinite",
                  ["--rank-color" as string]: `${charClass.color}70`,
                  ["--rank-color-faint" as string]: `${charClass.color}20`,
                }}>
                  {RANK_ICONS["Nacional"]} NACIONAL
                </span>
              ) : (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap",
                  background: `${charClass.color}12`,
                  border: `1.5px solid ${charClass.color}${charClass.minLevel >= 20 ? "55" : "35"}`,
                  color: charClass.color,
                  fontSize: charClass.minLevel >= 20 ? 13 : 12,
                  fontWeight: 900, letterSpacing: 2,
                  textShadow: `0 0 8px ${charClass.color}80`,
                  boxShadow: charClass.minLevel >= 20
                    ? `0 0 14px ${charClass.color}40, inset 0 0 6px ${charClass.color}10`
                    : `0 0 4px ${charClass.color}18`,
                  animation: charClass.minLevel >= 20 ? "rank-glow 2s ease-in-out infinite" : undefined,
                  ["--rank-color" as string]: `${charClass.color}55`,
                  ["--rank-color-faint" as string]: `${charClass.color}15`,
                }}>
                  {RANK_ICONS[charClass.name]} {charClass.name}
                </span>
              )}
              {streak > 0 && (
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: `${streakColor(streak)}10`, border: `1px solid ${streakColor(streak)}30`, color: streakColor(streak), fontWeight: 700, display: "flex", alignItems: "center", gap: 4, animation: streak >= 7 ? "glow-pulse 2s ease-in-out infinite" : undefined }}>
                  <Flame size={10} /> {streak} dia{streak !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{ maxWidth: 340 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
                <span style={{ color: "#444", display: "flex", alignItems: "center", gap: 4 }}><Heart size={10} color={hpColor} /> HP</span>
                <span style={{ color: hpColor, fontWeight: 600 }}>{hp} / {maxHp}</span>
              </div>
              <StatBar current={hp} max={maxHp} color={hpColor} height={7} />
              {/* Rest feedback */}
              {restRegen > 0 ? (
                <div style={{ fontSize: 10, color: "#22c55e", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  💤 Descansou · +{restRegen} HP recuperado
                </div>
              ) : hpPct <= 25 ? (
                <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>⚠ HP crítico — descanse {hoursUntilRest}h para recuperar</div>
              ) : isResting ? (
                <div style={{ fontSize: 10, color: "#22d3ee", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  💤 Em descanso · +{nextRegen} HP ao voltar
                </div>
              ) : hp < maxHp ? (
                <div style={{ fontSize: 10, color: "#333", marginTop: 4 }}>
                  Descanse {hoursUntilRest}h para recuperar +{nextRegen} HP
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexShrink: 0 }}>
            {[
              { v: totalXP.toLocaleString(), l: "XP TOTAL",  c: "#f59e0b" },
              { v: dailies.length,            l: "DAILIES",   c: "#22d3ee" },
              { v: epics.length,              l: "EPICS",     c: "#c084fc" },
              ...(bosses.length > 0 ? [{ v: bosses.length, l: "BOSS", c: "#ef4444" }] : []),
            ].map((s) => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#3a3a3a", marginTop: 2, letterSpacing: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Attribute pills */}
        <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
          {allAttrs.map((attr) => {
            const cls   = getClass(ATTR_CLASSES[attr.type] || [], attr.level);
            const color = ATTR_COLORS[attr.type];
            return (
              <span key={attr.type} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: `${color}07`, border: `1px solid ${color}18`, fontSize: 10 }}>
                <span style={{ color, fontWeight: 700 }}>{attr.type}</span>
                <span style={{ color: "#555" }}>{cls.name}</span>
                <span style={{ color: "#2e2e2e" }}>Lv.{attr.level}</span>
              </span>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: "1px solid #161616", flexWrap: "wrap" }}>
          <form action={resetDailies}>
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7, border: "1px solid #222", background: "#0d0d0d", color: "#555", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)" }}>
              <RefreshCw size={11} /> Reset Dailies
            </button>
          </form>
          <ResetModal />
        </div>
      </div>

      {/* ── XP Semanal ───────────────────────────────── */}
      <Section label="XP esta semana">
        {hasXP ? (
          <XPChart data={weeklyXP} />
        ) : (
          <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "#2e2e2e" }}>
            Nenhum XP registrado ainda — complete quests para ver o gráfico.
          </div>
        )}
      </Section>

      {/* ── Calendário de atividade ───────────────────── */}
      <Section label="Atividade">
        <div style={{ background: "#0d0d0d", border: "1px solid #181818", borderRadius: 10, padding: "18px 20px" }}>
          <ActivityCalendar data={activity.data} totalXP={activity.totalXP} />
        </div>
      </Section>

      {/* ── Atributos ────────────────────────────────── */}
      <Section label="Atributos">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {allAttrs.map((attr, i) => (
            <div key={attr.type} className="animate-float-in" style={{ animationDelay: `${i * 0.07}s`, opacity: 0 }}>
              <AttributeCard type={attr.type} xp={attr.xp} level={attr.level} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Quests ativas ────────────────────────────── */}
      {dailies.length > 0 && (
        <Section label="Dailies ativas">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dailies.map((q, i) => (
              <div key={q.id} className="animate-slide-right" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {epics.length > 0 && (
        <Section label="Epic Quests ativas">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {epics.map((q, i) => (
              <div key={q.id} className="animate-slide-right" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {bosses.length > 0 && (
        <Section label="Boss Quests ativas">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bosses.map((q, i) => (
              <div key={q.id} className="animate-slide-right" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Atividade recente ────────────────────────── */}
      {recentLogs.length > 0 && (
        <Section label="Atividade recente">
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {recentLogs.map((log, i) => {
              const ok = log.action === "COMPLETED";
              return (
                <div key={log.id} className="animate-float-in" style={{ animationDelay: `${i * 0.04}s`, opacity: 0, display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "#111", border: `1px solid ${ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"}`, borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: ok ? "#22c55e" : "#ef4444", fontWeight: 700, minWidth: 14 }}>{ok ? "✓" : "✗"}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ATTR_COLORS[log.quest.attribute], minWidth: 28, letterSpacing: 1 }}>{log.quest.attribute}</span>
                  <span style={{ flex: 1, color: "#bbb" }}>{log.quest.title}</span>
                  {log.xpChange  > 0 && <span style={{ color: "#f59e0b", fontSize: 11 }}>+{log.xpChange} XP</span>}
                  {log.hpChange !== 0 && (
                    <span style={{ color: log.hpChange > 0 ? "#22c55e" : "#ef4444", fontSize: 11 }}>
                      {log.hpChange > 0 ? "+" : ""}{log.hpChange} HP
                    </span>
                  )}
                  <span style={{ color: "#222", fontSize: 10 }}>{new Date(log.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#333", letterSpacing: 2, textTransform: "uppercase" }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: "#161616" }} />
      </div>
      {children}
    </div>
  );
}
