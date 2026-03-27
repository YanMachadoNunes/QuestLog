import { prisma } from "@/lib/prisma";
import { ATTR_COLORS } from "@/lib/xp";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const logs = await prisma.questLog.findMany({
    include: { quest: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const grouped: Record<string, typeof logs> = {};
  for (const log of logs) {
    const date = new Date(log.createdAt).toLocaleDateString("pt-BR", { dateStyle: "full" });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f59e0b", letterSpacing: 1 }}>
          ◷ Activity Log
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555" }}>
          Histórico completo de ações e XP ganho
        </p>
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", color: "#333", fontSize: 13 }}>
          Nenhuma atividade registrada ainda.<br />Complete sua primeira quest para começar o log.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(grouped).map(([date, dayLogs]) => {
            const xpGanho = dayLogs.filter((l) => l.action === "COMPLETED").reduce((s, l) => s + l.xpChange, 0);
            const hpPerdido = dayLogs.filter((l) => l.hpChange < 0).reduce((s, l) => s + Math.abs(l.hpChange), 0);

            return (
              <div key={date}>
                {/* Date header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: "1px solid #1a1a1a",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>{date}</span>
                  {xpGanho > 0 && (
                    <span style={{ fontSize: 11, color: "#f59e0b" }}>+{xpGanho} XP</span>
                  )}
                  {hpPerdido > 0 && (
                    <span style={{ fontSize: 11, color: "#ef4444" }}>-{hpPerdido} HP</span>
                  )}
                  <span style={{ fontSize: 11, color: "#333", marginLeft: "auto" }}>
                    {dayLogs.length} eventos
                  </span>
                </div>

                {/* Events */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {dayLogs.map((log) => {
                    const isGood = log.action === "COMPLETED";
                    const color = isGood ? "#22c55e" : "#ef4444";
                    const attrColor = ATTR_COLORS[log.quest.attribute] || "#888";

                    return (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          background: "#111",
                          border: `1px solid ${isGood ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}`,
                          borderRadius: 7,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color, fontWeight: 700, fontSize: 14, minWidth: 16 }}>
                          {isGood ? "✓" : "✗"}
                        </span>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: attrColor,
                            letterSpacing: 1,
                            minWidth: 28,
                          }}
                        >
                          {log.quest.attribute}
                        </span>

                        <span style={{ flex: 1, color: "#bbb" }}>{log.quest.title}</span>

                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: log.quest.type === "EPIC" ? "rgba(245,158,11,0.1)" : "transparent",
                            color: log.quest.type === "EPIC" ? "#f59e0b" : "#444",
                          }}
                        >
                          {log.quest.type === "EPIC" ? "★ EPIC" : "DAILY"}
                        </span>

                        {log.xpChange > 0 && (
                          <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 11 }}>
                            +{log.xpChange} XP
                          </span>
                        )}

                        {log.hpChange !== 0 && (
                          <span
                            style={{
                              color: log.hpChange > 0 ? "#22c55e" : "#ef4444",
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          >
                            {log.hpChange > 0 ? "+" : ""}{log.hpChange} HP
                          </span>
                        )}

                        <span style={{ color: "#2a2a2a", fontSize: 10 }}>
                          {new Date(log.createdAt).toLocaleTimeString("pt-BR", { timeStyle: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
