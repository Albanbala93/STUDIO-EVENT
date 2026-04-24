import Link from "next/link";

const features = [
  {
    num: "01",
    title: "Analyse stratégique complète",
    desc: "Diagnostic de la problématique réelle, angle différenciant, architecture du dispositif — pas une reformulation du brief.",
  },
  {
    num: "02",
    title: "Dispositif structuré en 14 sections",
    desc: "Messages par audience, plan de déploiement, KPIs mesurables, analyse des risques, scénarios comparatifs.",
  },
  {
    num: "03",
    title: "Contenus prêts à diffuser",
    desc: "Email direction, post intranet, kit manager, FAQ — rédigés, calibrés au ton demandé, activables immédiatement.",
  },
  {
    num: "04",
    title: "Copilote événementiel",
    desc: "Formats recommandés, dispositif avant / pendant / après, storytelling événementiel, points de vigilance.",
  },
];

const proofPoints = [
  { value: "~25s", label: "Temps de génération" },
  { value: "14", label: "Sections produites" },
  { value: "4+", label: "Contenus rédigés" },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── HERO ─────────────────────────────────── */}
      <section style={{
        background: "var(--navy)",
        padding: "80px 40px 72px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle ambient light */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(ellipse at 75% 30%, rgba(99, 102, 241, 0.22) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div style={{ maxWidth: 760 }}>
            {/* Overline */}
            <p style={{
              margin: "0 0 28px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.38)",
            }}>
              Plateforme de conseil en communication interne
            </p>

            {/* Display headline */}
            <h1 style={{
              margin: "0 0 24px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px, 5vw, 58px)",
              fontWeight: 400,
              color: "var(--white)",
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
            }}>
              Du brief au dispositif de campagne —{" "}
              <em style={{ color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                en quelques secondes.
              </em>
            </h1>

            {/* Body */}
            <p style={{
              margin: "0 0 40px",
              fontSize: 16,
              color: "rgba(255,255,255,0.58)",
              lineHeight: 1.75,
              maxWidth: 580,
            }}>
              Campaign Studio produit un plan stratégique complet, des messages par audience
              et des contenus rédigés au niveau d&apos;un cabinet de conseil.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/studio/new" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "13px 26px",
                background: "var(--white)",
                color: "var(--navy)",
                borderRadius: "var(--radius-sm)",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                letterSpacing: "-0.01em",
                transition: "opacity 0.2s",
              }}>
                Créer un dispositif →
              </Link>
              <Link href="/studio" style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "13px 22px",
                background: "transparent",
                color: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "var(--radius-sm)",
                fontWeight: 500,
                fontSize: 14,
                textDecoration: "none",
                letterSpacing: "0.005em",
              }}>
                Voir les projets
              </Link>
              <Link href="/momentum" style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "13px 22px",
                background: "transparent",
                color: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "var(--radius-sm)",
                fontWeight: 500,
                fontSize: 14,
                textDecoration: "none",
                letterSpacing: "0.005em",
              }}>
                📊 Momentum
              </Link>
            </div>
          </div>

          {/* Proof points */}
          <div style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            gap: 0,
          }}>
            {proofPoints.map(({ value, label }, i) => (
              <div key={label} style={{
                paddingRight: 48,
                marginRight: 48,
                borderRight: i < proofPoints.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>
                <p style={{
                  margin: "0 0 4px",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "var(--white)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  fontFamily: "var(--font-body)",
                }}>
                  {value}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section style={{
        background: "var(--surface)",
        padding: "80px 40px",
        flex: 1,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ marginBottom: 52 }}>
            <p style={{
              margin: "0 0 10px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--slate-light)",
            }}>
              Ce que génère la plateforme
            </p>
            <h2 style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: 30,
              fontWeight: 400,
              color: "var(--navy)",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}>
              Un dossier de conseil complet,<br />
              <em style={{ color: "var(--slate)", fontStyle: "italic" }}>personnalisé à votre brief.</em>
            </h2>
          </div>

          {/* Feature grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}>
            {features.map((f) => (
              <div key={f.num} style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "28px 26px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "var(--slate-light)",
                  fontFamily: "var(--font-body)",
                }}>
                  {f.num}
                </span>
                <div>
                  <h3 style={{
                    margin: "0 0 8px",
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: "var(--navy)",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.35,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--slate)",
                    lineHeight: 1.65,
                  }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────── */}
      <section style={{
        background: "var(--white)",
        borderTop: "1px solid var(--border)",
        padding: "56px 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 40,
            flexWrap: "wrap",
          }}>
            <div>
              <p style={{
                margin: "0 0 8px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--slate-light)",
              }}>
                Prêt à démarrer ?
              </p>
              <h2 style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 400,
                color: "var(--navy)",
                letterSpacing: "-0.01em",
              }}>
                Remplissez un brief en 5 minutes.
              </h2>
            </div>
            <Link href="/studio/new" className="btn btn-primary" style={{
              padding: "13px 28px",
              fontSize: 14,
              borderRadius: "var(--radius-sm)",
              flexShrink: 0,
            }}>
              Créer un dispositif →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
