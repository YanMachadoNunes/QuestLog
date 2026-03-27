"use client";

import { useState, useTransition } from "react";
import { resetCharacter } from "@/lib/actions";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ResetModal() {
  const [open, setOpen]           = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  const close = () => { setOpen(false); setConfirmed(false); };

  const handle = () => {
    if (!confirmed) return;
    startTransition(() => resetCharacter());
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 13px", borderRadius: 7,
          border: "1px solid rgba(239,68,68,0.2)",
          background: "rgba(239,68,68,0.05)",
          color: "#666", fontSize: 11, cursor: "pointer",
          fontFamily: "var(--font-mono)",
          transition: "color 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#666"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.2)"; }}
      >
        <RotateCcw size={11} /> Resetar Personagem
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-scale-in"
            style={{
              background: "#111", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 16, padding: "32px 36px", maxWidth: 400, width: "90%",
              boxShadow: "0 0 60px rgba(239,68,68,0.1)",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>

            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#e5e5e5" }}>
              Resetar Personagem?
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#555", lineHeight: 1.5 }}>
              Todo XP, níveis e streak serão zerados. Os logs de atividade serão apagados.
              <strong style={{ color: "#888" }}> Suas quests ficam salvas.</strong>
            </p>

            {/* Confirm checkbox */}
            <label style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 8,
              background: "#0e0e0e", border: "1px solid #1e1e1e",
              cursor: "pointer", marginBottom: 20, fontSize: 12, color: "#666",
            }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ accentColor: "#ef4444", width: 14, height: 14 }}
              />
              Entendo que esta ação é irreversível
            </label>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={close}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8,
                  border: "1px solid #1e1e1e", background: "#0e0e0e",
                  color: "#555", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handle}
                disabled={!confirmed || pending}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8,
                  border: `1px solid ${confirmed ? "rgba(239,68,68,0.4)" : "#1e1e1e"}`,
                  background: confirmed ? "rgba(239,68,68,0.1)" : "#0a0a0a",
                  color: confirmed ? "#ef4444" : "#333",
                  fontSize: 13, fontWeight: 700,
                  cursor: confirmed ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-mono)",
                  transition: "all 0.15s",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? "Resetando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
