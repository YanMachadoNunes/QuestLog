"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { ATTR_COLORS, ATTR_LABELS } from "@/lib/xp";

export interface DayXP {
  label: string;
  FRC: number;
  INT: number;
  CAR: number;
  DES: number;
  SAB: number;
  total: number;
  isToday: boolean;
}

const ATTRS = ["FRC", "INT", "CAR", "DES", "SAB"] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  if (total === 0) return null;
  return (
    <div style={{
      background: "#0f0f0f", border: "1px solid #222", borderRadius: 10,
      padding: "12px 14px", fontSize: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    }}>
      <div style={{ color: "#555", marginBottom: 8, fontSize: 10, letterSpacing: 1 }}>{label}</div>
      {ATTRS.map((attr) => {
        const p = payload.find((x: any) => x.dataKey === attr);
        if (!p?.value) return null;
        return (
          <div key={attr} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: ATTR_COLORS[attr], flexShrink: 0 }} />
            <span style={{ color: "#666", fontSize: 10 }}>{ATTR_LABELS[attr]}</span>
            <span style={{ color: ATTR_COLORS[attr], fontWeight: 700, marginLeft: "auto", fontSize: 11 }}>+{p.value}</span>
          </div>
        );
      })}
      <div style={{ borderTop: "1px solid #1e1e1e", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>TOTAL</span>
        <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 13 }}>+{total} XP</span>
      </div>
    </div>
  );
}

export default function XPChart({ data }: { data: DayXP[] }) {
  const weekTotal = data.reduce((s, d) => s + d.total, 0);
  const bestDay   = data.length ? data.reduce((b, d) => d.total > b.total ? d : b, data[0]) : null;
  const todayXP   = data.find(d => d.isToday)?.total ?? 0;
  const avgXP     = data.length ? Math.round(weekTotal / data.filter(d => d.total > 0).length || 0) : 0;

  return (
    <div style={{
      background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 12,
      padding: "20px 20px 16px", overflow: "hidden",
    }}>
      {/* ── Header stats ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 4 }}>ESTA SEMANA</div>
          {weekTotal > 0 ? (
            <div style={{ fontSize: 26, fontWeight: 900, color: "#f59e0b", lineHeight: 1, letterSpacing: -0.5 }}>
              +{weekTotal.toLocaleString()}
              <span style={{ fontSize: 12, fontWeight: 500, color: "#555", marginLeft: 5 }}>XP</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>Sem XP ainda</div>
          )}
        </div>

        {/* Secondary stats */}
        <div style={{ display: "flex", gap: 16 }}>
          {todayXP > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 3 }}>HOJE</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#e5e5e5" }}>+{todayXP}</div>
              <div style={{ fontSize: 9, color: "#555" }}>XP</div>
            </div>
          )}
          {bestDay && bestDay.total > 0 && !bestDay.isToday && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 3 }}>MELHOR DIA</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#e5e5e5" }}>{bestDay.label}</div>
              <div style={{ fontSize: 9, color: "#f59e0b" }}>+{bestDay.total} XP</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bar chart ── */}
      <div style={{ width: "100%", height: 160, marginBottom: 14 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={22} margin={{ top: 2, right: 0, left: -34, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={(props) => {
                const d = data[props.index];
                return (
                  <text
                    x={props.x} y={Number(props.y) + 13}
                    textAnchor="middle"
                    fill={d?.isToday ? "#f59e0b" : "#3a3a3a"}
                    fontSize={10}
                    fontWeight={d?.isToday ? 700 : 400}
                    fontFamily="var(--font-mono)"
                  >
                    {props.payload.value}
                  </text>
                );
              }}
              axisLine={false} tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.025)", radius: 5 }} />
            {ATTRS.map((attr, i) => (
              <Bar
                key={attr}
                dataKey={attr}
                stackId="a"
                fill={ATTR_COLORS[attr]}
                radius={i === ATTRS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              >
                {data.map((entry, ci) => (
                  <Cell
                    key={ci}
                    fillOpacity={entry.isToday ? 1 : 0.35}
                    style={entry.isToday ? { filter: `drop-shadow(0 0 4px ${ATTR_COLORS[attr]}60)` } : undefined}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Attribute legend ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid #161616" }}>
        {ATTRS.map(attr => (
          <div key={attr} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#555" }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: ATTR_COLORS[attr], opacity: 0.85 }} />
            <span style={{ color: ATTR_COLORS[attr], fontWeight: 700, letterSpacing: 0.5 }}>{attr}</span>
            <span>{ATTR_LABELS[attr]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
