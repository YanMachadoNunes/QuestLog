import { prisma } from "@/lib/prisma";
import QuestCard from "@/components/QuestCard";
import FilterBar from "@/components/FilterBar";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { autoFailDailies } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function QuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ attr?: string }>;
}) {
  await autoFailDailies();
  const { attr } = await searchParams;

  const where = attr ? { attribute: attr } : {};
  const quests = await prisma.quest.findMany({
    where,
    include: { subTasks: { orderBy: { order: "asc" } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const dailies       = quests.filter(q => q.type === "DAILY");
  const epics         = quests.filter(q => q.type === "EPIC");
  const bosses        = quests.filter(q => q.type === "BOSS");
  const activeDailies = dailies.filter(q => q.status === "ACTIVE");
  const doneDailies   = dailies.filter(q => q.status !== "ACTIVE");
  const activeEpics   = epics.filter(q => q.status === "ACTIVE");
  const doneEpics     = epics.filter(q => q.status !== "ACTIVE");
  const activeBosses  = bosses.filter(q => q.status === "ACTIVE");
  const doneBosses    = bosses.filter(q => q.status !== "ACTIVE");
  const totalActive   = quests.filter(q => q.status === "ACTIVE").length;

  return (
    <div className="animate-float-in">

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e5e5e5", letterSpacing: 0.5 }}>Quests</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#444" }}>
            {totalActive} missão{totalActive !== 1 ? "ões" : ""} ativa{totalActive !== 1 ? "s" : ""}
            {attr && <span style={{ color: "#555" }}> · filtro: {attr}</span>}
          </p>
        </div>
        <Link href="/quests/new" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)",
          background: "rgba(245,158,11,0.07)", color: "#f59e0b",
          fontSize: 12, fontWeight: 700, textDecoration: "none",
          fontFamily: "var(--font-mono)", letterSpacing: 0.5,
        }}>
          <Plus size={13} /> Nova Quest
        </Link>
      </div>

      {/* ── Filter bar ──────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <Suspense fallback={null}>
          <FilterBar />
        </Suspense>
      </div>

      {/* ── Dailies ─────────────────────────────────── */}
      <Section label="Missões Diárias" badge={`${activeDailies.length} ativa${activeDailies.length !== 1 ? "s" : ""}`} color="#22d3ee">
        {activeDailies.length === 0 && doneDailies.length === 0 ? (
          <Empty message="Nenhuma daily." action={{ href: "/quests/new", label: "Criar →" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeDailies.map((q, i) => (
              <div key={q.id} className="animate-float-in" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
            {doneDailies.map(q => <QuestCard key={q.id} quest={q} />)}
          </div>
        )}
      </Section>

      {/* ── Epic Quests ─────────────────────────────── */}
      <Section label="Epic Quests" badge={`${activeEpics.length} ativa${activeEpics.length !== 1 ? "s" : ""}`} color="#f59e0b">
        {activeEpics.length === 0 && doneEpics.length === 0 ? (
          <Empty message="Nenhuma epic quest." action={{ href: "/quests/new", label: "Criar →" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeEpics.map((q, i) => (
              <div key={q.id} className="animate-float-in" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
            {doneEpics.map(q => <QuestCard key={q.id} quest={q} />)}
          </div>
        )}
      </Section>

      {/* ── Boss Quests ─────────────────────────────── */}
      {(activeBosses.length > 0 || doneBosses.length > 0) && (
        <Section label="Boss Quests" badge={`${activeBosses.length} ativa${activeBosses.length !== 1 ? "s" : ""}`} color="#ef4444">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeBosses.map((q, i) => (
              <div key={q.id} className="animate-float-in" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <QuestCard quest={q} />
              </div>
            ))}
            {doneBosses.map(q => <QuestCard key={q.id} quest={q} />)}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ label, badge, color, children }: { label: string; badge?: string; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: color ?? "#444", letterSpacing: 2, textTransform: "uppercase" }}>{label}</span>
        {badge && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#141414", border: "1px solid #1e1e1e", color: "#333" }}>{badge}</span>
        )}
        <div style={{ flex: 1, height: 1, background: "#161616" }} />
      </div>
      {children}
    </div>
  );
}

function Empty({ message, action }: { message: string; action: { href: string; label: string } }) {
  return (
    <div style={{ padding: "28px 0", textAlign: "center", color: "#333", fontSize: 12 }}>
      {message}{" "}
      <Link href={action.href} style={{ color: "#f59e0b", textDecoration: "none" }}>{action.label}</Link>
    </div>
  );
}
