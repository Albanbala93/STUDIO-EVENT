import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const metrics = [
  { label: "Measured KPIs", value: "18", note: "Source data verified" },
  { label: "Estimated KPIs", value: "7", note: "Method and confidence required" },
  { label: "Score confidence", value: "74", note: "Weighted by data completeness" },
];

type SavedProject = {
  id: string;
  name: string;
  initiative_type: string | null;
  audience: string | null;
  overall_score: number | null;
  confidence_score: number | null;
  created_at: string;
};

const INITIATIVE_LABELS: Record<string, string> = {
  corporate_event: "Événement corporate",
  digital_campaign: "Campagne digitale",
  change_management: "Accompagnement du changement",
  newsletter: "Newsletter interne",
  product_launch: "Lancement produit",
  other: "Autre initiative",
};

function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#84cc16";
  if (score >= 40) return "#fbbf24";
  return "#ef4444";
}

async function loadProjects(): Promise<SavedProject[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    // L'API peut être hors-ligne — on ne casse pas la home pour autant.
    return [];
  }
}

export default async function Page() {
  const projects = await loadProjects();

  return (
    <main className="workspace">
      <section className="intro">
        <p className="eyebrow">Momentum</p>
        <h1>Measure communication, event, and CSR impact with confidence.</h1>
        <p>
          Separate measured performance from estimates, track missing inputs, and keep every
          initiative tied to tenant-scoped KPI definitions.
        </p>
        <p style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/diagnostic"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.25rem",
              borderRadius: 8,
              background: "#205f46",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Lancer un diagnostic →
          </Link>
          <Link
            href="/library"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.25rem",
              borderRadius: 8,
              background: "transparent",
              color: "#205f46",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid #205f46",
            }}
          >
            Mémoire stratégique →
          </Link>
        </p>
      </section>

      <section className="metricGrid" aria-label="Momentum KPI summary">
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
          </article>
        ))}
      </section>

      {/* Liste des projets sauvegardés — affichée seulement s'il y en a. */}
      {projects.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: "1.5rem", marginTop: 0, marginBottom: 16 }}>
            Diagnostics sauvegardés
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {projects.map((p) => {
              const color = scoreColor(p.overall_score);
              const typeLabel = p.initiative_type
                ? INITIATIVE_LABELS[p.initiative_type] ?? p.initiative_type
                : "—";
              const date = new Date(p.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  style={{
                    display: "block",
                    padding: 18,
                    borderRadius: 8,
                    background: "#ffffff",
                    border: "1px solid #ccd7ce",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.15s, border-color 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#17211b" }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 2,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: color + "22",
                        color,
                        fontWeight: 700,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.overall_score !== null ? Math.round(p.overall_score) : "—"}
                      <span style={{ fontSize: 10, opacity: 0.7 }}>/100</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#4c5a50" }}>
                    {typeLabel}
                    {p.audience ? ` · ${p.audience}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#718077", marginTop: 6 }}>
                    Enregistré le {date}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
