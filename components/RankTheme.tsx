"use client";

import { useEffect } from "react";

export default function RankTheme({ color }: { color: string }) {
  useEffect(() => {
    document.documentElement.style.setProperty("--rank-accent", color);
  }, [color]);
  return null;
}
