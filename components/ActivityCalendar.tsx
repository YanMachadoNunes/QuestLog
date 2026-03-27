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
  if (xp === 0)   return "#111";
  if (xp < 50)    return "#0e3d1a";
  if (xp < 150)   return "#1a6b30";
  if (xp < 300)   return "#22a63a";
  return "#39d353";
}

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DAY_LABELS   = ["D","S","T","Q","Q","S","S"];

export default function ActivityCalendar({ data, totalXP }: Props) {
  const map = new Map(data.map((d) => [d.date, d.xp]));

  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split("T")[0];

  // Build 16 weeks grid: start from Sunday 16 weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 16 * 7 + 1);
  // Rewind to Sunday
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

  // Month label positions: track first week of each month
  const monthLabels: { weekIdx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0].getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ weekIdx: wi, label: MONTH_LABELS[m] });
      lastMonth = m;
    }
  });

  const CELL = 14;
  const GAP  = 3;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: "#444", letterSpacing: 1 }}>
          ÚLTIMAS 16 SEMANAS
        </span>
        {totalXP > 0 && (
          <span style={{ fontSize: 10, color: "#f59e0b" }}>
            +{totalXP.toLocaleString()} XP
          </span>
        )}
      </div>

      {/* Month labels row */}
      <div style={{ display: "flex", marginBottom: 4, paddingLeft: 20 }}>
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.weekIdx === wi);
          return (
            <div key={wi} style={{ width: CELL + GAP, flexShrink: 0, fontSize: 9, color: "#444" }}>
              {ml ? ml.label : ""}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* Day of week labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: GAP }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} style={{ width: 12, height: CELL, fontSize: 9, color: "#333", display: "flex", alignItems: "center" }}>
              {i % 2 === 1 ? l : ""}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ display: "flex", gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
              {week.map((date, di) => {
                const key = date.toISOString().split("T")[0];
                const xp  = map.get(key) ?? 0;
                const isToday   = key === todayStr;
                const isFuture  = date > today;
                return (
                  <div
                    key={di}
                    title={isFuture ? "" : `${key}${xp > 0 ? ` · +${xp} XP` : " · sem atividade"}`}
                    style={{
                      width: CELL, height: CELL,
                      borderRadius: 3,
                      background: isFuture ? "transparent" : xpColor(xp),
                      border: isToday
                        ? "1px solid rgba(245,158,11,0.7)"
                        : isFuture
                        ? "none"
                        : "1px solid rgba(255,255,255,0.03)",
                      transition: "transform 0.1s",
                      cursor: xp > 0 ? "default" : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isFuture) (e.currentTarget as HTMLDivElement).style.transform = "scale(1.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 9, color: "#333" }}>Menos</span>
        {[0, 25, 100, 220, 400].map((v) => (
          <div key={v} style={{ width: 11, height: 11, borderRadius: 2, background: xpColor(v), border: "1px solid rgba(255,255,255,0.04)" }} />
        ))}
        <span style={{ fontSize: 9, color: "#333" }}>Mais</span>
      </div>
    </div>
  );
}
