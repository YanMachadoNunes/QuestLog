import { prisma } from "@/lib/prisma";
import {
  getLevelInfo, ATTR_COLORS, ATTR_LABELS, ATTR_DESC,
  ATTR_CLASSES, getClass, getCharacterLevel,
} from "@/lib/xp";

export const dynamic = "force-dynamic";

const ATTR_ORDER = ["FRC", "INT", "CAR", "DES", "SAB"];

const ATTR_EMOJI: Record<string, string> = {
  FRC: "💪",
  INT: "⚡",
  CAR: "🗣",
  DES: "🎯",
  SAB: "📖",
};

export default async function AttributesPage() {
  const [attributes, quests, completedLogs] = await Promise.all([
    prisma.attribute.findMany({ where: { type: { not: { endsWith: "_test" } } } }),
    prisma.quest.findMany(),
    prisma.questLog.findMany({
      where: { action: "COMPLETED" },
      select: { quest: { select: { attribute: true } } },
    }),
  ]);

  const completedByAttr = completedLogs.reduce((acc, log) => {
    acc[log.quest.attribute] = (acc[log.quest.attribute] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attrMap = Object.fromEntries(attributes.map((a) => [a.type, a]));
  const allAttrs = ATTR_ORDER.map(
    (t) => attrMap[t] || { id: t, type: t, xp: 0, level: 1 }
  );

  const charLevel = getCharacterLevel(allAttrs.map(a => a.level));

  return (
    <div className="animate-float-in">
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#e5e5e5", letterSpacing: 0.3 }}>
          Atributos
        </h1>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#333" }}>
          Progresso de cada habilidade do personagem
        </p>
      </div>

      {/* ── Overview strip ─────────────────────────────── */}
      <div style={{
        background: "#111", border: "1px solid #1c1c1c", borderRadius: 10,
        padding: "16px 20px", marginBottom: 28,
        display: "flex", gap: 0, flexWrap: "wrap",
      }}>
        {allAttrs.map((attr, i) => {
          const color = ATTR_COLORS[attr.type];
          const { level, progress } = getLevelInfo(attr.xp);
          return (
            <div
              key={attr.type}
              style={{
                flex: 1, minWidth: 80, padding: "0 16px",
                borderRight: i < allAttrs.length - 1 ? "1px solid #1a1a1a" : "none",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{ATTR_EMOJI[attr.type]}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 1, marginBottom: 6 }}>
                {attr.type}
              </div>
              {/* Mini progress ring via text */}
              <div style={{
                fontSize: 16, fontWeight: 900, color, lineHeight: 1, marginBottom: 4,
              }}>
                {level}
              </div>
              {/* Mini bar */}
              <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${progress}%`,
                  background: color, borderRadius: 2,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 3 }}>{progress}%</div>
            </div>
          );
        })}
      </div>

      {/* ── Attribute cards ────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 14,
      }}>
        {allAttrs.map((attr, cardIdx) => {
          const color      = ATTR_COLORS[attr.type];
          const { level, currentXP, xpForNext, progress } = getLevelInfo(attr.xp);
          const tiers      = ATTR_CLASSES[attr.type] || [];
          const currentTier = getClass(tiers, level);
          const currentTierIdx = tiers.findIndex(t => t.name === currentTier.name);
          const nextTier   = tiers[currentTierIdx + 1] ?? null;
          const attrQuests = quests.filter((q) => q.attribute === attr.type);
          const completedCount = completedByAttr[attr.type] ?? 0;
          const activeCount = attrQuests.filter((q) => q.status === "ACTIVE").length;
          const xpToNext   = xpForNext - currentXP;

          // Tier progress (levels within current tier)
          const tierStart = currentTier.minLevel;
          const tierEnd   = nextTier?.minLevel ?? 100;
          const tierLevelProgress = tierEnd > tierStart
            ? Math.min(100, Math.round(((level - tierStart) / (tierEnd - tierStart)) * 100))
            : 100;

          return (
            <div
              key={attr.type}
              className="animate-float-in"
              style={{
                animationDelay: `${cardIdx * 0.07}s`, opacity: 0,
                background: "#111",
                border: `1px solid #1c1c1c`,
                borderRadius: 12,
                overflow: "hidden",
                transition: "border-color 0.2s, transform 0.15s",
              }}
            >
              {/* ── Card top band ── */}
              <div style={{
                padding: "18px 20px 16px",
                background: `linear-gradient(135deg, ${color}0c 0%, transparent 60%)`,
                borderBottom: `1px solid ${color}12`,
                display: "flex", alignItems: "flex-start", gap: 14,
              }}>
                {/* Attribute icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: `${color}10`,
                  border: `1.5px solid ${color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {ATTR_EMOJI[attr.type]}
                </div>

                {/* Name + desc */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0" }}>
                      {ATTR_LABELS[attr.type]}
                    </span>
                    <span style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 4,
                      background: `${color}0e`, border: `1px solid ${color}22`,
                      color, fontWeight: 700, letterSpacing: 1,
                    }}>
                      {attr.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: 3, lineHeight: 1.4 }}>
                    {ATTR_DESC[attr.type]}
                  </div>
                </div>

                {/* Level */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: 32, fontWeight: 900, color, lineHeight: 1,
                    textShadow: `0 0 20px ${color}40`,
                  }}>
                    {level}
                  </div>
                  <div style={{ fontSize: 9, color: "#2e2e2e", letterSpacing: 1 }}>NÍVEL</div>
                </div>
              </div>

              {/* ── Body ── */}
              <div style={{ padding: "16px 20px 20px" }}>

                {/* Current class + next */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "#2e2e2e", letterSpacing: 1.5, marginBottom: 2 }}>
                      CLASSE ATUAL
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color }}>
                      {currentTier.name}
                    </div>
                  </div>
                  {nextTier && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#2e2e2e", letterSpacing: 1.5, marginBottom: 2 }}>
                        PRÓXIMA CLASSE
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>
                        {nextTier.name}
                        <span style={{ color: "#2a2a2a", fontWeight: 400 }}> · Lv.{nextTier.minLevel}</span>
                      </div>
                    </div>
                  )}
                  {!nextTier && (
                    <div style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 6,
                      background: `${color}10`, border: `1px solid ${color}25`,
                      color, fontWeight: 700, letterSpacing: 1,
                    }}>
                      ★ MÁXIMO
                    </div>
                  )}
                </div>

                {/* ── Tier track ── */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "4px 0" }}>
                    {/* Connecting line */}
                    <div style={{
                      position: "absolute",
                      left: 8, right: 8, top: "50%",
                      transform: "translateY(-50%)",
                      height: 1,
                      background: "#1c1c1c",
                    }} />
                    {/* Filled line (progress) */}
                    <div style={{
                      position: "absolute",
                      left: 8, top: "50%",
                      transform: "translateY(-50%)",
                      height: 1,
                      background: color,
                      opacity: 0.4,
                      width: tiers.length > 1
                        ? `calc(${(currentTierIdx / (tiers.length - 1)) * 100}% + ${currentTierIdx > 0 ? ((tierLevelProgress / 100) * (100 / (tiers.length - 1))) : 0}% - 16px)`
                        : "0%",
                      transition: "width 0.5s ease",
                    }} />
                    {/* Tier dots */}
                    {tiers.map((tier, idx) => {
                      const isPast    = idx < currentTierIdx;
                      const isCurrent = idx === currentTierIdx;
                      const isFuture  = idx > currentTierIdx;
                      return (
                        <div
                          key={tier.name}
                          style={{
                            flex: 1, display: "flex", flexDirection: "column",
                            alignItems: idx === 0 ? "flex-start" : idx === tiers.length - 1 ? "flex-end" : "center",
                          }}
                        >
                          <div style={{
                            width: isCurrent ? 12 : 8,
                            height: isCurrent ? 12 : 8,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: isPast || isCurrent ? color : "#1e1e1e",
                            border: isCurrent ? `2px solid ${color}` : isPast ? "none" : "1px solid #2a2a2a",
                            boxShadow: isCurrent ? `0 0 10px ${color}80` : undefined,
                            position: "relative", zIndex: 1,
                            transition: "all 0.2s",
                          }} />
                          <div style={{
                            fontSize: 8,
                            marginTop: 6,
                            color: isCurrent ? color : isPast ? "#444" : "#222",
                            fontWeight: isCurrent ? 700 : 400,
                            whiteSpace: "nowrap",
                            maxWidth: idx === 0 ? 60 : idx === tiers.length - 1 ? 60 : 44,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            textAlign: idx === 0 ? "left" : idx === tiers.length - 1 ? "right" : "center",
                          }}>
                            {isCurrent ? tier.name : tier.rank}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── XP Bar ── */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "#333" }}>Lv.{level} → Lv.{level + 1}</span>
                    <span style={{ fontSize: 10, color, fontWeight: 600 }}>
                      {currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${color}aa, ${color})`,
                      borderRadius: 4,
                      transition: "width 0.5s ease",
                      boxShadow: progress > 10 ? `0 0 8px ${color}40` : undefined,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: "#222" }}>{progress}% completo</span>
                    <span style={{ fontSize: 9, color: "#333" }}>faltam {xpToNext.toLocaleString()} XP</span>
                  </div>
                </div>

                {/* ── Stats grid ── */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 1, borderRadius: 8, overflow: "hidden",
                  border: "1px solid #1a1a1a",
                }}>
                  {[
                    { value: activeCount,    label: "ativas",     color: "#22d3ee" },
                    { value: completedCount, label: "concluídas", color: "#22c55e" },
                    { value: attrQuests.length, label: "total",   color: "#444"   },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        padding: "10px 8px",
                        background: "#0d0d0d",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: 9, color: "#2e2e2e", marginTop: 3, letterSpacing: 0.5 }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
