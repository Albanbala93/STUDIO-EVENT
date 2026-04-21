"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  API_BASE_URL,
  CampaignSummary,
  INITIATIVE_LABELS,
  Memory,
  STATUS_META,
  formatDateFR,
} from "./shared";

export default function StudioHome() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[] | null>(null);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/campaigns`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/memory`).then((r) => r.json()),
    ])
      .then(([c, m]) => {
        setCampaigns(c);
        setMemory(m);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={errBox}>Erreur : {error}</div>;
  if (!campaigns || !memory) return <div style={{ color: "#a78bfa" }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>
      {/* Liste campagnes */}
      <div>
        <h1 style={{ fontSize: 28, margin: "0 0 4px 0" }}>Mes campagnes</h1>
        <p style={{ color: "#a78bfa", margin: "0 0 24px 0", fontSize: 14 }}>
          {campaigns.length === 0
            ? "Aucune campagne créée pour le moment."
            : `${campaigns.length} campagne${campaigns.length > 1 ? "s" : ""}`}
        </p>

        {campaigns.length === 0 ? (
          <div style={emptyBox}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Lancez votre première campagne
            </div>
            <div style={{ color: "#a78bfa", marginBottom: 16 }}>
              Campaign Studio génère le plan stratégique, et Momentum prépare la mesure
              automatiquement.
            </div>
            <Link href="/studio/new" style={primaryBtn}>
              + Nouvelle campagne →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {campaigns.map((c) => {
              const meta = STATUS_META[c.status];
              return (
                <Link
                  key={c.id}
                  href={`/studio/${c.id}`}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: "rgba(168,85,247,0.06)",
                    border: "1px solid rgba(168,85,247,0.18)",
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#e9e2ff" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4 }}>
                      {(c.initiative_type && INITIATIVE_LABELS[c.initiative_type]) || "—"}
                      {c.audience && ` · ${c.audience}`}
                      {c.launch_date && ` · Lancement ${formatDateFR(c.launch_date)}`}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      background: meta.color + "22",
                      color: meta.color,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {meta.icon} {meta.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar : mémoire Momentum */}
      <aside>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(168,85,247,0.10), rgba(77,95,255,0.08))",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#a78bfa",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            🧠 Mémoire Momentum
          </div>
          {!memory.available ? (
            <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
              Mémoire en construction. Plus que{" "}
              <strong style={{ color: "#e9e2ff" }}>
                {Math.max(0, memory.minimum_required - memory.sample_size)}
              </strong>{" "}
              projet(s) à mesurer dans Momentum pour activer les insights stratégiques.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 13 }}>
                <ProfileLine label="Score moyen" value={`${Math.round(memory.profil_communication.score_moyen ?? 0)}/100`} />
                <ProfileLine label="Point fort" value={memory.profil_communication.point_fort ?? "—"} />
                <ProfileLine label="Point faible" value={memory.profil_communication.point_faible ?? "—"} />
                <ProfileLine
                  label="Tendance"
                  value={
                    memory.profil_communication.tendance === "progression"
                      ? "📈 En progression"
                      : memory.profil_communication.tendance === "regression"
                      ? "📉 En régression"
                      : memory.profil_communication.tendance === "stabilite"
                      ? "→ Stable"
                      : "—"
                  }
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  paddingTop: 8,
                  borderTop: "1px solid rgba(168,85,247,0.18)",
                }}
              >
                Mise à jour : {new Date(memory.last_updated).toLocaleDateString("fr-FR")}
                <br />
                Basée sur {memory.sample_size} projet{memory.sample_size > 1 ? "s" : ""} · {memory.insights.length} insights actifs
              </div>
            </>
          )}
        </div>

        <Link
          href="/connection"
          style={{
            display: "block",
            marginTop: 12,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(168,85,247,0.06)",
            border: "1px solid rgba(168,85,247,0.18)",
            color: "#cbd5e1",
            textDecoration: "none",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Voir le tableau de bord de la connexion →
        </Link>
      </aside>
    </div>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: "#a78bfa" }}>{label}</span>
      <span style={{ color: "#e9e2ff", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 8,
  background: "#8b5cf6",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
};

const emptyBox: React.CSSProperties = {
  padding: 40,
  borderRadius: 10,
  background: "rgba(168,85,247,0.04)",
  border: "1px dashed rgba(168,85,247,0.25)",
  textAlign: "center",
};

const errBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
};
