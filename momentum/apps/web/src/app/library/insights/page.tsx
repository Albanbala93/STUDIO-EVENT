"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL } from "../shared";

type Insight = {
  kind: string;
  title: string;
  body: string;
  recommendation: string;
  sample_size: number;
};

type InsightsResponse = {
  unlocked: boolean;
  sample_size: number;
  minimum_required: number;
  insights: Insight[];
  generated_at: string;
};

const KIND_META: Record<string, { icon: string; color: string; label: string }> = {
  channel: { icon: "📡", color: "#4d5fff", label: "Insight canal" },
  audience: { icon: "👥", color: "#22c55e", label: "Insight audience" },
  timing: { icon: "⏱️", color: "#fbbf24", label: "Insight timing" },
  message: { icon: "💬", color: "#f97316", label: "Insight message" },
};

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [confirmSync, setConfirmSync] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/analytics/insights`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  async function generateBrief() {
    setBriefing(true);
    setBriefError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/brief`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `API ${res.status}`);
      }
      const body = await res.json();
      // Téléchargement markdown — stub du bridge Campaign Studio.
      const blob = new Blob([body.markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `momentum-brief-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setBriefError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setBriefing(false);
    }
  }

  async function syncToCS() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/sync-insights`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `API ${res.status}`);
      }
      const body = await res.json();
      setSyncMsg(
        `✓ Mémoire Campaign Studio mise à jour — ${body.insights_count ?? data?.insights.length ?? 0} insights poussés (échantillon ${body.sample_size ?? data?.sample_size ?? 0} projets).`
      );
      setConfirmSync(false);
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? `Erreur : ${e.message}` : "Erreur inconnue");
    } finally {
      setSyncing(false);
    }
  }

  if (error) return <div style={errBox}>Erreur : {error}</div>;
  if (!data) return <div style={{ color: "#64748b" }}>Chargement…</div>;

  const generatedDate = data.generated_at
    ? new Date(data.generated_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : "—";

  return (
    <div>
      <h1 style={{ fontSize: 28, margin: "0 0 4px 0" }}>Intelligence Campaign Studio</h1>
      <p style={{ color: "#94a3b8", margin: "0 0 24px 0", fontSize: 14 }}>
        {data.unlocked
          ? `Basé sur ${data.sample_size} projets — mis à jour ${generatedDate}`
          : `Plus que ${data.minimum_required - data.sample_size} analyse${
              data.minimum_required - data.sample_size > 1 ? "s" : ""
            } pour débloquer vos premiers insights stratégiques.`}
      </p>

      {!data.unlocked ? (
        <div style={lockedBox}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Insights verrouillés
          </div>
          <div style={{ color: "#94a3b8", maxWidth: 480, margin: "0 auto" }}>
            Minimum {data.minimum_required} projets requis pour générer des patterns fiables.
            Vous en avez <strong style={{ color: "#e2e8f0" }}>{data.sample_size}</strong>.
            <br />
            Chaque nouveau diagnostic sauvegardé enrichit la détection de patterns (canal, audience,
            timing, message).
          </div>
        </div>
      ) : data.insights.length === 0 ? (
        <div style={emptyBox}>
          Aucun pattern saillant détecté pour l'instant — vos projets sont homogènes sur les
          dimensions analysées, ou la variété d'audiences/canaux reste trop limitée.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 14, marginBottom: 32 }}>
            {data.insights.map((ins, i) => {
              const meta = KIND_META[ins.kind] ?? { icon: "💡", color: "#94a3b8", label: ins.kind };
              return (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: "rgba(148,163,184,0.05)",
                    border: "1px solid rgba(148,163,184,0.15)",
                    borderLeft: `4px solid ${meta.color}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: meta.color,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {meta.icon} {meta.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Basé sur {ins.sample_size} projets
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>
                    {ins.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 10 }}>
                    {ins.body}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: meta.color,
                      lineHeight: 1.6,
                      paddingTop: 10,
                      borderTop: "1px solid rgba(148,163,184,0.1)",
                    }}
                  >
                    → <strong>Recommandation</strong> : {ins.recommendation}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(77,95,255,0.12), rgba(124,58,237,0.08))",
              border: "1px solid rgba(77,95,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                🚀 Envoyer ces insights à Campaign Studio
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
                Génère un brief historique pré-rempli (canal prioritaire, audience à renforcer,
                timing, angles morts) prêt à être importé dans votre prochain plan stratégique.
              </div>
              {briefError && (
                <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 8 }}>{briefError}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setConfirmSync(true)}
                disabled={syncing}
                style={{
                  padding: "12px 22px",
                  borderRadius: 10,
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: syncing ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {syncing ? "Envoi…" : "🔗 Enrichir Campaign Studio"}
              </button>
              <button
                onClick={generateBrief}
                disabled={briefing}
                style={{
                  padding: "12px 22px",
                  borderRadius: 10,
                  background: "#4d5fff",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: briefing ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {briefing ? "Génération…" : "Télécharger le brief"}
              </button>
            </div>
          </div>

          {syncMsg && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 8,
                background: syncMsg.startsWith("✓")
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(239,68,68,0.08)",
                border: `1px solid ${
                  syncMsg.startsWith("✓") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
                }`,
                color: syncMsg.startsWith("✓") ? "#86efac" : "#fca5a5",
                fontSize: 13,
              }}
            >
              {syncMsg}
            </div>
          )}

          {confirmSync && (
            <div
              role="dialog"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
              }}
              onClick={() => !syncing && setConfirmSync(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#0f172a",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 12,
                  padding: 24,
                  maxWidth: 480,
                  width: "90%",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: "#e2e8f0" }}>
                  Enrichir Campaign Studio ?
                </h3>
                <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                  Vous allez pousser <strong style={{ color: "#86efac" }}>{data.insights.length}</strong> insights
                  agrégés (basés sur <strong>{data.sample_size}</strong> projets) vers la mémoire stratégique de
                  Campaign Studio. Ces insights apparaîtront dans le brief des prochaines campagnes.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setConfirmSync(false)}
                    disabled={syncing}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid rgba(148,163,184,0.3)",
                      color: "#cbd5e1",
                      fontSize: 13,
                      cursor: syncing ? "not-allowed" : "pointer",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={syncToCS}
                    disabled={syncing}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      background: "#22c55e",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: syncing ? "wait" : "pointer",
                    }}
                  >
                    {syncing ? "Envoi…" : "Confirmer l'envoi"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const lockedBox: React.CSSProperties = {
  padding: 60,
  borderRadius: 12,
  background: "rgba(148,163,184,0.04)",
  border: "1px dashed rgba(148,163,184,0.2)",
  textAlign: "center",
};

const emptyBox: React.CSSProperties = {
  padding: 40,
  borderRadius: 10,
  background: "rgba(148,163,184,0.04)",
  border: "1px dashed rgba(148,163,184,0.2)",
  textAlign: "center",
  color: "#94a3b8",
};

const errBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
};
