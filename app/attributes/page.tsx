import { prisma } from "@/lib/prisma";
import { getLevelInfo, ATTR_COLORS, ATTR_LABELS, ATTR_DESC } from "@/lib/xp";
import StatBar from "@/components/StatBar";

export const dynamic = "force-dynamic";

export default async function AttributesPage() {
  const [attributes, quests, completedLogs] = await Promise.all([
    prisma.attribute.findMany({ where: { type: { not: { endsWith: "_test" } } } }),
    prisma.quest.findMany(),
    prisma.questLog.findMany({
      where: { action: "COMPLETED" },
      select: { quest: { select: { attribute: true } } },
    }),
  ]);

  // Historical completion count per attribute (based on permanent log, not transient status)
  const completedByAttr = completedLogs.reduce((acc, log) => {
    acc[log.quest.attribute] = (acc[log.quest.attribute] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attrMap = Object.fromEntries(attributes.map((a) => [a.type, a]));
  const allAttrs = ["FRC", "INT", "CAR", "DES", "SAB"].map(
    (t) => attrMap[t] || { id: t, type: t, xp: 0, level: 1 }
  );

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f59e0b", letterSpacing: 1 }}>
          ◈ Atributos
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555" }}>
          Progresso de cada habilidade do personagem
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {allAttrs.map((attr) => {
          const color = ATTR_COLORS[attr.type];
          const { level, currentXP, xpForNext, progress } = getLevelInfo(attr.xp);
          const attrQuests = quests.filter((q) => q.attribute === attr.type);
          const completedCount = completedByAttr[attr.type] ?? 0;
          const active = attrQuests.filter((q) => q.status === "ACTIVE");

          return (
            <div
              key={attr.type}
              style={{
                background: "#111",
                border: `1px solid #1f1f1f`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 10,
                padding: 24,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      background: `${color}12`,
                      border: `1px solid ${color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 700,
                      color,
                      letterSpacing: 1,
                    }}
                  >
                    {attr.type}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#e5e5e5" }}>{ATTR_LABELS[attr.type]}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{ATTR_DESC[attr.type]}</div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>Lv.{level}</div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{attr.xp.toLocaleString()} XP total</div>
                </div>
              </div>

              {/* XP Progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: "#555" }}>Progresso para Lv.{level + 1}</span>
                  <span style={{ color }}>
                    {currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP
                    <span style={{ color: "#444", marginLeft: 8 }}>({progress}%)</span>
                  </span>
                </div>
                <StatBar current={currentXP} max={xpForNext} color={color} height={6} />
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  paddingTop: 16,
                  borderTop: "1px solid #1a1a1a",
                  fontSize: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span style={{ color: "#444" }}>Quests ativas: </span>
                  <span style={{ color: "#e5e5e5", fontWeight: 600 }}>{active.length}</span>
                </div>
                <div>
                  <span style={{ color: "#444" }}>Concluídas: </span>
                  <span style={{ color: "#22c55e", fontWeight: 600 }}>{completedCount}</span>
                </div>
                <div>
                  <span style={{ color: "#444" }}>Total: </span>
                  <span style={{ color: "#888", fontWeight: 600 }}>{attrQuests.length}</span>
                </div>
                <div>
                  <span style={{ color: "#444" }}>XP para próximo: </span>
                  <span style={{ color, fontWeight: 600 }}>{(xpForNext - currentXP).toLocaleString()} XP</span>
                </div>
              </div>

              {/* Level milestones */}
              <div style={{ marginTop: 16, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[1, 2, 3, 5, 10, 15, 20].map((lv) => (
                  <span
                    key={lv}
                    style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: level >= lv ? `${color}15` : "#0f0f0f",
                      border: `1px solid ${level >= lv ? `${color}30` : "#1a1a1a"}`,
                      color: level >= lv ? color : "#333",
                      fontWeight: level >= lv ? 600 : 400,
                    }}
                  >
                    Lv{lv}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
