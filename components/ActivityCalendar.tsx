"use client";

export interface DayActivity {
  date: string; // YYYY-MM-DD
  xp: number;
}

interface Props {
  data: DayActivity[];
  totalXP: number;
}

function xpColor(xp: number): string {
  if (xp === 0)    return "#0f0f0f";
  if (xp < 50)     return "#3b2000";
  if (xp < 150)    return "#7c4700";
  if (xp < 300)    return "#c47a00";
  return "#f59e0b";
}

function xpOpacity(xp: number): number {
  if (xp === 0)   return 1;
  if (xp < 50)    return 0.7;
  if (xp < 150)   return 0.8;
  if (xp < 300)   return 0.9;
  return 1;
}

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DAY_LABELS   = ["D","S","T","Q","Q","S","S"];

export default function ActivityCalendar({ data, totalXP }: Props) {
  const map = new Map(data.map((d) => [d.date, d.xp]));

  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split("T")[0];

  // Build 16 weeks grid
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 16 * 7 + 1);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: Date[][] = [];
  const cursor = new Date(startDate);
  while (cursor <= today || weeks.length < 16) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 16) break;
  }

  // Month label positions
  const monthLabels: { weekIdx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0].getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ weekIdx: wi, label: MONTH_LABELS[m] });
      lastMonth = m;
    }
  });

  // Stats
  const activeDays = data.filter(d => d.xp > 0).length;
  const bestXP = data.length ? Math.max(...data.map(d => d.xp)) : 0;

  const CELL = 13;
  const GAP  = 3;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 2, marginBottom: 4 }}>ÚLTIMAS 16 SEMANAS</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {totalXP > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>
                +{totalXP.toLocaleString()} XP
              </span>
            )}
            {activeDays > 0 && (
              <span style={{ fontSize: 11, color: "#444" }}>
                {activeDays} {activeDays === 1 ? "dia ativo" : "dias ativos"}
              </span>
            )}
          </div>
        </div>
        {bestXP > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 2, marginBottom: 3 }}>MELHOR DIA</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>+{bestXP.toLocaleString()} XP</div>
          </div>
        )}
      </div>

      {/* ── Month labels row ── */}
      <div style={{ display: "flex", marginBottom: 5, paddingLeft: 20 }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.weekIdx === wi);
          return (
            <div key={wi} style={{ width: CELL + GAP, flexShrink: 0, fontSize: 8, color: "#333", letterSpacing: 0.5 }}>
              {ml ? ml.label : ""}
            </div>
          );
        })}
      </div>

      {/* ── Grid ── */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* Day of week labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: GAP + 1 }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} style={{ width: 12, height: CELL, fontSize: 8, color: "#2a2a2a", display: "flex", alignItems: "center" }}>
              {i % 2 === 1 ? l : ""}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ display: "flex", gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
              {week.map((date, di) => {
                const key     = date.toISOString().split("T")[0];
                const xp      = map.get(key) ?? 0;
                const isToday = key === todayStr;
                const isFuture = date > today;
                return (
                  <div
                    key={di}
                    title={isFuture ? "" : `${key}${xp > 0 ? ` · +${xp} XP` : " · sem atividade"}`}
                    style={{
                      width: CELL, height: CELL,
                      borderRadius: 3,
                      background: isFuture ? "transparent" : xpColor(xp),
                      opacity: isFuture ? 0 : xpOpacity(xp),
                      border: isToday
                        ? "1.5px solid #f59e0b"
                        : isFuture
                        ? "none"
                        : xp > 0
                        ? `1px solid rgba(245,158,11,0.08)`
                        : "1px solid #1a1a1a",
                      boxShadow: isToday ? "0 0 6px rgba(245,158,11,0.4)" : undefined,
                      transition: "transform 0.1s, opacity 0.1s",
                      cursor: xp > 0 ? "default" : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!isFuture) {
                        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.4)";
                        (e.currentTarget as HTMLDivElement).style.opacity = "1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                      (e.currentTarget as HTMLDivElement).style.opacity = isFuture ? "0" : String(xpOpacity(xp));
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 8, color: "#2a2a2a", letterSpacing: 0.5 }}>Menos</span>
        {[0, 30, 100, 200, 400].map((v) => (
          <div
            key={v}
            style={{
              width: CELL, height: CELL, borderRadius: 3,
              background: xpColor(v),
              border: v === 0 ? "1px solid #1a1a1a" : `1px solid rgba(245,158,11,0.1)`,
            }}
          />
        ))}
        <span style={{ fontSize: 8, color: "#2a2a2a", letterSpacing: 0.5 }}>Mais</span>
      </div>
    </div>
  );
}
