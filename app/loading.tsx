export default function Loading() {
  return (
    <div style={{ animation: "float-in 0.3s ease forwards" }}>
      {/* Skeleton header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "flex-start" }}>
        <div>
          <Skel width={100} height={20} />
          <Skel width={220} height={12} style={{ marginTop: 8 }} />
        </div>
        <Skel width={110} height={34} radius={8} />
      </div>

      {/* Skeleton streak banner */}
      <Skel width="100%" height={80} radius={14} style={{ marginBottom: 20 }} />

      {/* Skeleton character card */}
      <Skel width="100%" height={160} radius={14} style={{ marginBottom: 28 }} />

      {/* Skeleton section */}
      <SkeletonSection label="XP esta semana">
        <Skel width="100%" height={100} radius={10} />
      </SkeletonSection>

      <SkeletonSection label="Atributos">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skel key={i} width="100%" height={80} radius={10} />
          ))}
        </div>
      </SkeletonSection>

      <SkeletonSection label="Dailies ativas">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skel key={i} width="100%" height={68} radius={10} />
          ))}
        </div>
      </SkeletonSection>
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

function SkeletonSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#1e1e1e", letterSpacing: 2 }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: "#161616" }} />
      </div>
      {children}
    </div>
  );
}
