import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileCheck2,
  Leaf,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { LandingHeaderNav } from "./_components/landing-header-nav";

type PipelineStep = {
  step: string;
  verb: string;
  module: string;
  icon: ReactNode;
  tagline: string;
  deliverables: string[];
  href: string;
};

const PIPELINE: PipelineStep[] = [
  {
    step: "01",
    verb: "Concevez",
    module: "Campaign Studio",
    icon: <Sparkles size={20} strokeWidth={1.6} />,
    tagline: "Du brief au plan stratégique en quelques minutes.",
    deliverables: [
      "Plan stratégique complet, prêt à défendre",
      "Messages calibrés par audience",
      "Contenus rédigés et activables",
    ],
    href: "/studio",
  },
  {
    step: "02",
    verb: "Mesurez",
    module: "Momentum",
    icon: <BarChart3 size={20} strokeWidth={1.6} />,
    tagline: "La performance de chaque dispositif, objectivée.",
    deliverables: [
      "Diagnostic 4 dimensions + score consolidé",
      "Indicateurs de fiabilité par mesure",
      "Actions correctives priorisées",
    ],
    href: "/momentum",
  },
  {
    step: "03",
    verb: "Démontrez",
    module: "RSE",
    icon: <Leaf size={20} strokeWidth={1.6} />,
    tagline: "L'impact extra-financier de votre communication.",
    deliverables: [
      "Piliers Environnement · Social · Gouvernance",
      "Indicateurs alignés CSRD",
      "Reporting COMEX exportable",
    ],
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

      {/* ── Modules — pipeline ─────────────────────────── */}
      <section className="landing-modules" id="modules">
        <div className="landing-modules-inner">
          <div className="landing-modules-head">
            <p className="landing-modules-overline">Le système Stratly</p>
            <h2 className="landing-modules-title">
              Concevoir, mesurer, démontrer{" "}
              <span className="landing-modules-title-soft">— sans rupture.</span>
            </h2>
            <p className="landing-modules-lead">
              Trois modules pensés pour s&apos;enchaîner. La sortie de chaque
              étape devient la matière de la suivante.
            </p>
          </div>

          <ol
            className="landing-pipeline"
            aria-label="Les trois étapes du système Stratly"
          >
            {PIPELINE.map((p, i) => (
              <li key={p.step} className="landing-pipeline-item">
                <Link href={p.href} className="landing-pipeline-card">
                  <div className="landing-pipeline-card-head">
                    <span className="landing-pipeline-step" aria-hidden="true">
                      {p.step}
                    </span>
                    <span
                      className="landing-pipeline-icon"
                      aria-hidden="true"
                    >
                      {p.icon}
                    </span>
                  </div>

                  <div className="landing-pipeline-card-body">
                    <p className="landing-pipeline-verb">{p.verb}</p>
                    <h3 className="landing-pipeline-module">{p.module}</h3>
                    <p className="landing-pipeline-tagline">{p.tagline}</p>
                  </div>

                  <ul className="landing-pipeline-deliverables">
                    {p.deliverables.map((d) => (
                      <li key={d}>
                        <span
                          className="landing-pipeline-check"
                          aria-hidden="true"
                        >
                          <Check size={11} strokeWidth={2.5} />
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>

                  <span className="landing-pipeline-cta">
                    Accéder à {p.module}
                    <ArrowRight
                      className="landing-module-cta-arrow"
                      size={14}
                      strokeWidth={2}
                    />
                  </span>
                </Link>

                {i < PIPELINE.length - 1 && (
                  <span
                    className="landing-pipeline-connector"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 36 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 7h30M24 1l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ol>

          <div
            className="landing-pipeline-converge"
            role="note"
            aria-label="Sortie unifiée"
          >
            <span
              className="landing-pipeline-converge-icon"
              aria-hidden="true"
            >
              <FileCheck2 size={16} strokeWidth={1.8} />
            </span>
            <p>
              <strong>Sortie unifiée :</strong> un seul dossier consolidant
              design, performance et impact RSE — exportable au format COMEX.
            </p>
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
