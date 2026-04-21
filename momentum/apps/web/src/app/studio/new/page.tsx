"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { API_BASE_URL, INITIATIVE_LABELS } from "../shared";

const CHANNEL_OPTIONS = [
  "Email",
  "Intranet",
  "Événement physique",
  "Événement digital",
  "Yammer / Teams",
  "Newsletter",
  "Affichage",
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [type, setType] = useState("");
  const [audience, setAudience] = useState("");
  const [audienceSize, setAudienceSize] = useState<string>("");
  const [intent, setIntent] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [launchDate, setLaunchDate] = useState("");

  function toggleChannel(c: string) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brief: brief.trim() || null,
          initiative_type: type || null,
          audience: audience.trim() || null,
          audience_size: audienceSize ? Number(audienceSize) : null,
          intent: intent.trim() || null,
          channels,
          launch_date: launchDate || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `API ${res.status}`);
      }
      const created = await res.json();
      router.push(`/studio/${created.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, margin: "0 0 4px 0" }}>Nouvelle campagne</h1>
      <p style={{ color: "#a78bfa", margin: "0 0 24px 0", fontSize: 14 }}>
        Renseignez le brief — Campaign Studio générera le plan stratégique et Momentum préparera la mesure.
      </p>

      {error && <div style={errBox}>{error}</div>}

      <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
        <Field label="Nom de la campagne *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Lancement nouvelle politique RSE 2026"
            required
            style={inputStyle}
          />
        </Field>

        <Field label="Brief de la campagne (objectif, contexte)">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Quelques lignes décrivant le contexte, l'objectif business, le sponsor…"
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Type d'action">
            <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
              <option value="">— Sélectionner —</option>
              {Object.entries(INITIATIVE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date de lancement">
            <input
              type="date"
              value={launchDate}
              onChange={(e) => setLaunchDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <Field label="Audience cible">
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex : Tous collaborateurs, Managers intermédiaires, COMEX…"
              style={inputStyle}
            />
          </Field>
          <Field label="Taille d'audience">
            <input
              type="number"
              value={audienceSize}
              onChange={(e) => setAudienceSize(e.target.value)}
              placeholder="Nb personnes"
              min={0}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Intention principale">
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Ex : Faire adhérer à la nouvelle stratégie RSE"
            style={inputStyle}
          />
        </Field>

        <Field label="Canaux prévus">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CHANNEL_OPTIONS.map((c) => {
              const on = channels.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleChannel(c)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    border: on ? "1px solid #8b5cf6" : "1px solid rgba(168,85,247,0.25)",
                    background: on ? "rgba(139,92,246,0.18)" : "transparent",
                    color: on ? "#e9e2ff" : "#a78bfa",
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            style={{
              padding: "12px 22px",
              borderRadius: 10,
              background: name.trim() ? "#8b5cf6" : "rgba(168,85,247,0.2)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: submitting || !name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Création…" : "Créer la campagne →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#a78bfa", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  background: "rgba(168,85,247,0.06)",
  border: "1px solid rgba(168,85,247,0.18)",
  color: "#e9e2ff",
  fontSize: 14,
  boxSizing: "border-box",
};

const errBox: React.CSSProperties = {
  padding: 14,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
  marginBottom: 16,
  fontSize: 13,
};
