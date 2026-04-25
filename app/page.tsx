import Link from "next/link";
import { ArrowRight, BarChart3, Check, Leaf, Sparkles } from "lucide-react";
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
            Du brief à la{" "}
            <span className="landing-hero-accent">preuve d&apos;impact.</span>
          </h1>
          <p className="landing-hero-sub">
            Concevez vos dispositifs, mesurez leur performance et démontrez
            leur impact stratégique et RSE — avec la rigueur d&apos;un cabinet
            de conseil.
          </p>
          <div className="landing-hero-ctas">
            <Link href="/studio/new" className="landing-cta-primary">
              Essayer gratuitement
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link href="/momentum" className="landing-cta-secondary">
              Voir un exemple de diagnostic
            </Link>
          </div>

          <ul className="landing-hero-trust" aria-label="Points de réassurance">
            <li className="landing-hero-trust-item">
              <span className="landing-hero-trust-icon" aria-hidden="true">
                <Check size={12} strokeWidth={2.5} />
              </span>
              Sans carte bancaire
            </li>
            <li className="landing-hero-trust-divider" aria-hidden="true" />
            <li className="landing-hero-trust-item">
              <span className="landing-hero-trust-icon" aria-hidden="true">
                <Check size={12} strokeWidth={2.5} />
              </span>
              Diagnostic en moins de 5 minutes
            </li>
            <li className="landing-hero-trust-divider" aria-hidden="true" />
            <li className="landing-hero-trust-item">
              <span className="landing-hero-trust-icon" aria-hidden="true">
                <Check size={12} strokeWidth={2.5} />
              </span>
              Rapports prêts COMEX
            </li>
          </ul>
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
