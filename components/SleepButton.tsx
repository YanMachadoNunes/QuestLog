"use client";

import { startSleep, wakeUp } from "@/lib/actions";
import { useTransition, useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

function regenForHours(h: number) {
  return h >= 24 ? 35 : h >= 16 ? 25 : h >= 8 ? 15 : 0;
}

function formatDuration(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
}

export default function SleepButton({ sleepAt }: { sleepAt: Date | null }) {
  const [pending, start] = useTransition();
  const [elapsed, setElapsed] = useState(sleepAt ? Date.now() - new Date(sleepAt).getTime() : 0);

  useEffect(() => {
    if (!sleepAt) return;
    const id = setInterval(() => setElapsed(Date.now() - new Date(sleepAt).getTime()), 60_000);
    setElapsed(Date.now() - new Date(sleepAt).getTime());
    return () => clearInterval(id);
  }, [sleepAt]);

  if (sleepAt) {
    const sleptH = elapsed / 3_600_000;
    const regen  = regenForHours(sleptH);
    return (
      <button
        onClick={() => start(async () => { await wakeUp(); })}
        disabled={pending}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 13px", borderRadius: 7,
          border: "1px solid rgba(34,211,238,0.3)",
          background: "rgba(34,211,238,0.07)",
          color: "#22d3ee", fontSize: 11, cursor: "pointer",
          fontFamily: "var(--font-mono)", fontWeight: 700,
        }}
      >
        <Sun size={11} />
        Acordar · {formatDuration(elapsed)}
        {regen > 0 && <span style={{ color: "#22c55e", marginLeft: 2 }}>+{regen} HP</span>}
      </button>
    );
  }

  return (
    <button
      onClick={() => start(async () => { await startSleep(); })}
      disabled={pending}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 13px", borderRadius: 7,
        border: "1px solid #222",
        background: "#0d0d0d",
        color: "#555", fontSize: 11, cursor: "pointer",
        fontFamily: "var(--font-mono)", fontWeight: 700,
      }}
    >
      <Moon size={11} /> Dormir
    </button>
  );
}
