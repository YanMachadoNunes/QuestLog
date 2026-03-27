"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ATTR_COLORS, ATTR_LABELS } from "@/lib/xp";

const FILTERS = [
  { key: "ALL",  label: "Todos", color: "#555" },
  { key: "INT",  label: "INT",   color: ATTR_COLORS.INT  },
  { key: "CAR",  label: "CAR",   color: ATTR_COLORS.CAR  },
  { key: "DES",  label: "DES",   color: ATTR_COLORS.DES  },
  { key: "SAB",  label: "SAB",   color: ATTR_COLORS.SAB  },
];

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("attr") || "ALL";

  const set = (key: string) => {
    const p = new URLSearchParams(searchParams.toString());
    key === "ALL" ? p.delete("attr") : p.set("attr", key);
    router.push(`${pathname}${p.toString() ? "?" + p.toString() : ""}`, { scroll: false });
  };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {FILTERS.map(({ key, label, color }) => {
        const active = current === key;
        return (
          <button
            key={key}
            onClick={() => set(key)}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: `1px solid ${active ? color + "50" : "#1c1c1c"}`,
              background: active ? `${color}12` : "#0e0e0e",
              color: active ? color : "#444",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              letterSpacing: 0.5,
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
