"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ATTR_COLORS } from "@/lib/xp";

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
  return (
    <div style={{
      background: "#111", border: "1px solid #222", borderRadius: 8,
      padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ color: "#888", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {ATTRS.map((attr) => {
        const p = payload.find((x: any) => x.dataKey === attr);
        if (!p?.value) return null;
        return (
          <div key={attr} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: ATTR_COLORS[attr], display: "inline-block" }} />
            <span style={{ color: "#888" }}>{attr}</span>
            <span style={{ color: ATTR_COLORS[attr], fontWeight: 700, marginLeft: "auto" }}>+{p.value}</span>
          </div>
        );
      })}
      {total > 0 && (
        <div style={{ borderTop: "1px solid #1e1e1e", marginTop: 6, paddingTop: 6, color: "#f59e0b", fontWeight: 700 }}>
          Total: +{total} XP
        </div>
      )}
    </div>
  );
}

export default function XPChart({ data }: { data: DayXP[] }) {
  return (
    <div style={{ width: "100%", height: 140 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={20} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={(props) => {
              const d = data[props.index];
              return (
                <text
                  x={props.x} y={props.y + 12}
                  textAnchor="middle"
                  fill={d?.isToday ? "#f59e0b" : "#333"}
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 4 }} />
          {ATTRS.map((attr) => (
            <Bar key={attr} dataKey={attr} stackId="a" fill={ATTR_COLORS[attr]} radius={attr === "SAB" ? [3, 3, 0, 0] : [0, 0, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fillOpacity={entry.isToday ? 0.95 : 0.45} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
