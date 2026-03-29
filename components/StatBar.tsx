"use client";

import { useEffect, useRef, useState } from "react";

interface StatBarProps {
  current: number;
  max: number;
  color?: string;
  height?: number;
  label?: string;
  shake?: boolean;
}

export default function StatBar({ current, max, color = "#f59e0b", height = 4, label, shake }: StatBarProps) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  const [shaking, setShaking] = useState(false);
  const prevRef = useRef(current);

  useEffect(() => {
    if (current < prevRef.current || shake) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 500);
      prevRef.current = current;
      return () => clearTimeout(t);
    }
    prevRef.current = current;
  }, [current, shake]);

  return (
    <div style={{ animation: shaking ? "hp-shake 0.5s ease" : undefined }}>
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
