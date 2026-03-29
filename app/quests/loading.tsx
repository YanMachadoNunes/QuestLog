export default function Loading() {
  return (
    <div style={{ animation: "float-in 0.3s ease forwards" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <Skel width={80} height={20} />
        <div style={{ display: "flex", gap: 8 }}>
          <Skel width={80} height={32} radius={8} />
          <Skel width={110} height={32} radius={8} />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <Skel width="100%" height={44} radius={10} style={{ marginBottom: 16 }} />

      {/* Quest cards skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skel key={i} width="100%" height={72} radius={10} />
        ))}
      </div>
    </div>
  );
}

function Skel({
  width, height, radius = 6, style,
}: {
  width: number | string;
  height: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width, height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #141414 25%, #1c1c1c 50%, #141414 75%)",
        backgroundSize: "200% 100%",
        animation: "skel-shimmer 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
