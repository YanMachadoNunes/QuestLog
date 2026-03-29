"use client";

import { useRef, useState } from "react";
import { updateCharacterName } from "@/lib/actions";

export default function EditableName({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) { setValue(name); setEditing(false); return; }
    setEditing(false);
    await updateCharacterName(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setValue(name); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={32}
        style={{
          fontSize: 18, fontWeight: 700, color: "#e5e5e5",
          background: "rgba(255,255,255,0.04)", border: "1px solid #333",
          borderRadius: 6, padding: "2px 8px", fontFamily: "var(--font-mono)",
          outline: "none", width: 180,
        }}
      />
    );
  }

  return (
    <button
      onClick={handleEdit}
      title="Clique para editar nome"
      style={{
        fontSize: 18, fontWeight: 700, color: "#e5e5e5",
        background: "none", border: "none", borderBottom: "1px dashed #2a2a2a",
        cursor: "pointer", fontFamily: "var(--font-mono)", padding: 0,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderBottomColor = "#555")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderBottomColor = "#2a2a2a")}
    >
      {value}
    </button>
  );
}
