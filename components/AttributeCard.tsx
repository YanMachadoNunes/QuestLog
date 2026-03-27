import { ATTR_COLORS, ATTR_DESC, ATTR_LABELS, getLevelInfo, ATTR_CLASSES, getClass, isMilestoneLevel } from "@/lib/xp";
import StatBar from "./StatBar";

interface Props {
  type: string;
  xp: number;
  level: number;
  questCount?: number;
  completedCount?: number;
}

export default function AttributeCard({ type, xp, level, questCount = 0, completedCount = 0 }: Props) {
  const color = ATTR_COLORS[type] || "#f59e0b";
  const { currentXP, xpForNext, progress } = getLevelInfo(xp);
  const tiers = ATTR_CLASSES[type] || [];
  const cls = getClass(tiers, level);
  const milestone = isMilestoneLevel(level);

  return (
    <div
      style={{
        background: "#111",
        border: `1px solid ${milestone ? `${color}30` : "#1f1f1f"}`,
        borderRadius: 10,
        padding: 18,
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, transform 0.15s",
      }}
    >
      {/* Background glow for milestone levels */}
      {milestone && (
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 100, height: 100, borderRadius: "50%",
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: `${color}12`,
              border: `1.5px solid ${color}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color,
              letterSpacing: 1,
              flexShrink: 0,
            }}
          >
            {type}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{ATTR_LABELS[type]}</div>
            <div style={{ fontSize: 10, color, fontWeight: 600 }}>{cls.name}</div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
            {milestone ? "★" : ""} Lv.{level}
          </div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{xp} XP</div>
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10, color: "#444" }}>
          <span>→ Lv.{level + 1}</span>
          <span style={{ color }}>{currentXP} / {xpForNext}</span>
        </div>
        <StatBar current={currentXP} max={xpForNext} color={color} height={5} />
      </div>
    </div>
  );
}
