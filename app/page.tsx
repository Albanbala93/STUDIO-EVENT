import Link from "next/link";
import { ArrowRight, BarChart3, Leaf, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { LandingHeaderNav } from "./_components/landing-header-nav";

type ModuleCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  description: string;
  href: string;
};

const MODULES: ModuleCardProps[] = [
  {
    icon: <Sparkles size={22} strokeWidth={1.6} />,
    title: "Campaign Studio",
    subtitle: "Planifier et produire",
    description:
      "Générez en minutes un plan stratégique complet, vos messages par audience et tous vos contenus.",
    href: "/studio",
  },
  {
    icon: <BarChart3 size={22} strokeWidth={1.6} />,
    title: "Momentum",
    subtitle: "Mesurer et prouver",
    description:
      "Calculez votre score de performance, obtenez un diagnostic complet et exportez votre rapport COMEX en un clic.",
    href: "/momentum",
  },
  {
    icon: <Leaf size={22} strokeWidth={1.6} />,
    title: "RSE",
    subtitle: "Piloter et valoriser",
    description:
      "Mesurez et valorisez vos actions RSE avec un diagnostic structuré et des recommandations actionnables.",
    href: "/momentum",
  },
];

const PROOF_POINTS = [
  { value: "< 5 minutes", label: "Pour obtenir un diagnostic complet" },
  { value: "3 modules", label: "Communication, Performance, RSE" },
  { value: "COMEX-ready", label: "Rapports exportables en un clic" },
];

export default function HomePage() {
  return (
    <div className="landing-root" data-landing-page>
      {/* ── Sticky header ──────────────────────────────── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-mark">
              <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2.5 3.5h5M2.5 6.5h8M2.5 9.5h6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="landing-logo-text">Stratly</span>
          </Link>

          <LandingHeaderNav />
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-grid" aria-hidden="true" />
        <div className="landing-hero-inner">
          <span className="landing-hero-overline">
            <span className="landing-hero-overline-dot" aria-hidden="true" />
            Stratly · Plateforme communication
          </span>
          <h1>
            Une plateforme. Trois modules.{" "}
            <span className="landing-hero-accent">
              Une communication enfin mesurable.
            </span>
          </h1>
          <p className="landing-hero-sub">
            Stratly réunit Campaign Studio, Momentum et RSE pour planifier vos
            campagnes, mesurer leur performance et piloter vos engagements —
            tout au même endroit.
          </p>
          <div className="landing-hero-ctas">
            <Link href="/studio/new" className="landing-cta-primary">
              Essayer gratuitement
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link href="#modules" className="landing-cta-secondary">
              Voir les modules
            </Link>
          </div>

          <div className="landing-hero-lockup" aria-label="Modules inclus">
            <span className="landing-hero-lockup-label">Inclus</span>
            <span className="landing-hero-lockup-divider" aria-hidden="true" />
            <div className="landing-hero-lockup-items">
              {MODULES.map((m) => (
                <span key={m.title} className="landing-hero-lockup-chip">
                  <span className="landing-hero-lockup-chip-icon">
                    {m.icon}
                  </span>
                  {m.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Modules ────────────────────────────────────── */}
      <section className="landing-modules" id="modules">
        <div className="landing-modules-inner">
          <div className="landing-modules-head">
            <p className="landing-modules-overline">
              Trois modules · Une plateforme
            </p>
            <h2 className="landing-modules-title">
              Tout Stratly, en trois modules.
            </h2>
          </div>

          <div className="landing-modules-grid">
            {MODULES.map((m) => (
              <Link key={m.title} href={m.href} className="landing-module-card">
                <span className="landing-module-icon" aria-hidden="true">
                  {m.icon}
                </span>
                <div>
                  <p className="landing-module-subtitle">{m.subtitle}</p>
                  <h3 className="landing-module-title">{m.title}</h3>
                </div>
                <p className="landing-module-desc">{m.description}</p>
                <span className="landing-module-cta">
                  Accéder
                  <ArrowRight
                    className="landing-module-cta-arrow"
                    size={14}
                    strokeWidth={2}
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ───────────────────────────────── */}
      <section className="landing-proof" aria-label="Chiffres clés">
        <div className="landing-proof-inner">
          {PROOF_POINTS.map(({ value, label }) => (
            <div key={value} className="landing-proof-item">
              <p className="landing-proof-value">{value}</p>
              <p className="landing-proof-label">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────── */}
      <section id="cta-final" className="landing-cta-final">
        <div className="landing-cta-final-inner">
          <h2>Prêt à transformer votre communication&nbsp;?</h2>
          <p>Commencez gratuitement. Résultat en 5 minutes.</p>
          <Link
            href="/studio/new"
            className="landing-cta-primary landing-cta-primary-lg"
          >
            Essayer gratuitement
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="landing-footer-brand">
            <span className="landing-footer-mark" aria-hidden="true" />
            Stratly
          </span>
          <div className="landing-footer-links">
            <Link href="/studio">Campaign Studio</Link>
            <Link href="/momentum">Momentum</Link>
            <Link href="/momentum">RSE</Link>
          </div>
          <span>© {new Date().getFullYear()} Stratly</span>
        </div>
      </footer>
    </div>
  );
}
