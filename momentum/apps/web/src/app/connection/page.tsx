"use client";

/**
 * Tableau de bord de la connexion Campaign Studio ↔ Momentum.
 * Visible depuis les deux outils — c'est le pont qui rend l'intégration tangible.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  planned: { label: "Planifiée", color: "#a78bfa", icon: "📋" },
  measuring: { label: "Mesure en cours", color: "#fbbf24", icon: "⏳" },
  measured: { label: "Mesurée", color: "#22c55e", icon: "✓" },
};

const INITIATIVE_LABELS: Record<string, string> = {
  corporate_event: "Événement corporate",
  digital_campaign: "Campagne digitale",
  change_management: "Accompagnement du changement",
  newsletter: "Newsletter interne",
  product_launch: "Lancement produit",
  other: "Autre initiative",
};

type Dashboard = {
  campaigns_being_measured: {
    id: string;
    name: string;
    status: string;
    initiative_type: string | null;
    launch_date: string | null;
    days_since_launch: number | null;
    momentum_project_id: string | null;
    overall_score: number | null;
  }[];
  insights_active_in_studio: {
    available: boolean;
    sample_size: number;
    insights_count: number;
    last_updated: string;
  };
  next_action_to_measure: {
    id: string;
    name: string;
    launch_date: string | null;
  } | null;
};

export default function ConnectionDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  function load() {
    fetch(`${API_BASE_URL}/connection-status`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function syncNow() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/sync-insights`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `API ${res.status}`);
      }
      const body = await res.json();
      setSyncMsg(`✓ Insights synchronisés (${body.insights_count} insights · ${body.campaigns_updated} campagnes mises à jour)`);
      load();
    } catch (e: unknown) {
      setSyncMsg(`Erreur : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally {
      setSyncing(false);
    }
  }

  if (error) return <Wrap><div style={errBox}>Erreur : {error}</div></Wrap>;
  if (!data) return <Wrap><div style={{ color: "#94a3b8" }}>Chargement…</div></Wrap>;

  return (
    <Wrap>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 4px 0" }}>État de la connexion</h1>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
          🎨 Campaign Studio ↔ Momentum — vue unifiée du pont entre planification et mesure.
        </p>
      </div>

      {/* Section 1 : Campagnes en cours de mesure */}
      <Section title="Campagnes en cours de mesure" icon="📡">
        {data.campaigns_being_measured.length === 0 ? (
          <div style={emptyBox}>
            Aucune campagne créée dans Campaign Studio pour l'instant.
            <br />
            <Link href="/studio/new" style={{ ...primaryBtn, marginTop: 12 }}>
              + Créer une campagne →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {data.campaigns_being_measured.map((c) => {
              const meta = STATUS_META[c.status];
              return (
                <div
                  key={c.id}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: "rgba(148,163,184,0.05)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                      {(c.initiative_type && INITIATIVE_LABELS[c.initiative_type]) || "—"}
                      {c.launch_date && ` · Lancement ${new Date(c.launch_date).toLocaleDateString("fr-FR")}`}
                      {c.days_since_launch !== null && c.days_since_launch >= 0 && ` · J+${c.days_since_launch}`}
                      {c.days_since_launch !== null && c.days_since_launch < 0 && ` · Dans ${Math.abs(c.days_since_launch)}j`}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {c.overall_score !== null && (
                      <div
                        style={{
                          padding: "4px 12px",
                          borderRadius: 4,
                          background: "rgba(34,197,94,0.15)",
                          color: "#86efac",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {Math.round(c.overall_score)}/100
                      </div>
                    )}
                    <div
                      style={{
                        padding: "4px 10px",
                        borderRadius: 4,
                        background: meta.color + "22",
                        color: meta.color,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {meta.icon} {meta.label}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Link
                      href={`/studio/${c.id}`}
                      style={{ ...ghostBtn, padding: "6px 12px", fontSize: 12 }}
                    >
                      🎨 Studio
                    </Link>
                    {c.momentum_project_id ? (
                      <Link
                        href={`/projects/${c.momentum_project_id}`}
                        style={{ ...ghostBtn, padding: "6px 12px", fontSize: 12 }}
                      >
                        📊 Diagnostic
                      </Link>
                    ) : (
                      <Link
                        href={`/diagnostic?from_campaign=${c.id}&name=${encodeURIComponent(c.name)}${c.initiative_type ? `&type=${c.initiative_type}` : ""}`}
                        style={{ ...primaryBtn, padding: "6px 12px", fontSize: 12 }}
                      >
                        Saisir
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Section 2 : Insights actifs dans Campaign Studio */}
      <Section title="Insights actifs dans Campaign Studio" icon="🧠">
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(168,85,247,0.10), rgba(77,95,255,0.06))",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              {data.insights_active_in_studio.available ? (
                <>
                  <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>
                    {data.insights_active_in_studio.insights_count} insights stratégiques disponibles
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Basés sur {data.insights_active_in_studio.sample_size} projets Momentum · Dernière mise à jour{" "}
                    {new Date(data.insights_active_in_studio.last_updated).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>
                    Insights non encore disponibles
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    {data.insights_active_in_studio.sample_size} projets analysés — minimum 5 requis pour activer
                    le transfert vers Campaign Studio.
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/library/insights" style={ghostBtn}>
                Voir le détail
              </Link>
              <button
                onClick={syncNow}
                disabled={syncing || !data.insights_active_in_studio.available}
                style={{
                  ...primaryBtn,
                  background: data.insights_active_in_studio.available ? "#8b5cf6" : "rgba(148,163,184,0.2)",
                  cursor: syncing || !data.insights_active_in_studio.available ? "not-allowed" : "pointer",
                }}
              >
                {syncing ? "Sync…" : "🔗 Mettre à jour"}
              </button>
            </div>
          </div>
          {syncMsg && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 6,
                background: "rgba(34,197,94,0.1)",
                color: "#86efac",
                fontSize: 12,
              }}
            >
              {syncMsg}
            </div>
          )}
        </div>
      </Section>

      {/* Section 3 : Prochaine action à mesurer */}
      <Section title="Prochaine action à mesurer" icon="📅">
        {!data.next_action_to_measure ? (
          <div style={emptyBox}>
            Aucune action à venir programmée. Créez une campagne dans Campaign Studio pour
            anticiper sa mesure.
          </div>
        ) : (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.25)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>
                {data.next_action_to_measure.name}
              </div>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
                {data.next_action_to_measure.launch_date
                  ? `Lancement prévu le ${new Date(data.next_action_to_measure.launch_date).toLocaleDateString("fr-FR")}`
                  : "Date de lancement à définir"}
                {" · "}
                Plan de mesure ⏳ À configurer
              </div>
            </div>
            <Link href={`/studio/${data.next_action_to_measure.id}`} style={primaryBtn}>
              Configurer →
            </Link>
          </div>
        )}
      </Section>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, rgba(139,92,246,0.06), transparent 50%), #0a0d1a",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          padding: "18px 32px",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>
          ← Accueil
        </Link>
        <span style={{ color: "#334155" }}>·</span>
        <strong style={{ fontSize: 15 }}>🔗 Connexion Campaign Studio ↔ Momentum</strong>
        <nav style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          <Link href="/studio" style={{ ...ghostBtn, padding: "8px 14px" }}>
            🎨 Campaign Studio
          </Link>
          <Link href="/library" style={{ ...ghostBtn, padding: "8px 14px" }}>
            📊 Momentum
          </Link>
        </nav>
      </header>
      <main style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, marginBottom: 14, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 16px",
  borderRadius: 8,
  background: "#8b5cf6",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 13,
  border: "none",
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: 8,
  background: "transparent",
  color: "#cbd5e1",
  border: "1px solid rgba(148,163,184,0.2)",
  fontSize: 13,
  textDecoration: "none",
  cursor: "pointer",
};

const emptyBox: React.CSSProperties = {
  padding: 30,
  borderRadius: 10,
  background: "rgba(148,163,184,0.04)",
  border: "1px dashed rgba(148,163,184,0.2)",
  textAlign: "center",
  color: "#94a3b8",
  fontSize: 13,
};

const errBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
};
