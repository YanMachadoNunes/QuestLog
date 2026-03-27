interface StatBarProps {
  current: number;
  max: number;
  color?: string;
  height?: number;
  label?: string;
}

export default function StatBar({ current, max, color = "#f59e0b", height = 4, label }: StatBarProps) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  return (
    <div>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#666" }}>
          <span>{label}</span>
          <span>{current} / {max}</span>
        </div>
      )}
      <div style={{ height, background: "#1f1f1f", borderRadius: height / 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: height / 2,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}
