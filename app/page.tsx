import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  FileCheck2,
  Leaf,
  Lock,
  PlayCircle,
  Sparkles,
  Timer,
} from "lucide-react";
import type { ReactNode } from "react";

import { LandingHeaderNav } from "./_components/landing-header-nav";
import { Logo } from "../components/brand/logo";
import {
  HI_FI_ACCENTS,
  IlluBrief,
  IlluCollab,
  IlluDashboard,
  IlluNetwork,
  IlluPresentation,
  IlluStrategy,
} from "./_components/landing-illustrations";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Combien de temps pour un premier livrable ?",
    a: "Moins de 5 minutes pour un brief Campaign. Un diagnostic Pilot se construit en 15 à 20 minutes avec vos chiffres en main.",
  },
  {
    q: "Le volet RSE est-il défendable face à un COMEX ?",
    a: "Oui — la grille suit la logique CSRD : Environnement, Social, Gouvernance. Chaque mesure expose son indicateur de fiabilité, donc rien n'est mis sous le tapis.",
  },
  {
    q: "Mes briefs et données sont-ils protégés ?",
    a: "Vos contenus restent votre propriété. Stockage chiffré, hébergement Europe, et aucune donnée client n'alimente l'entraînement de modèles tiers.",
  },
  {
    q: "À partir de quel volume Stratly devient rentable ?",
    a: "Dès le premier dispositif. Là où un cabinet livre en quelques jours, Stratly produit un dossier exploitable en quelques minutes — la différence se voit immédiatement.",
  },
];

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
    module: "Campaign",
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
    module: "Pilot",
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
    module: "Impact",
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
          <Logo variant="full" size={32} href="/" priority />

          <LandingHeaderNav />
        </div>
      </header>

      {/* ── Hero (Hi-Fi Direction A) ──────────────────── */}
      <section className="hi-fi-hero">
        {/* Halos colorés en arrière-plan */}
        <div className="hi-fi-hero-halo hi-fi-hero-halo-teal" aria-hidden="true" />
        <div className="hi-fi-hero-halo hi-fi-hero-halo-violet" aria-hidden="true" />

        <div className="hi-fi-hero-inner">
          <div className="hi-fi-hero-text">
            <div className="hi-fi-fade-up hi-fi-hero-badge">
              <span className="hi-fi-hero-badge-dot hi-fi-pulse" aria-hidden="true" />
              Nouveau — Campaign + Pilot unifiés
            </div>

            <h1 className="hi-fi-fade-up-2 hi-fi-hero-title">
              L&apos;IA qui transforme
              <br />
              un brief en stratégie{" "}
              <em className="hi-fi-hero-accent">défendable</em>
              <br />
              et en livrable.
            </h1>

            <p className="hi-fi-fade-up-3 hi-fi-hero-sub">
              Une seule plateforme pour concevoir vos campagnes de communication,
              piloter vos KPIs et défendre vos projets en CODIR.
            </p>

            <div className="hi-fi-fade-up-3 hi-fi-hero-ctas">
              <Link href="/studio/new" className="hi-fi-cta-primary">
                Démarrer gratuitement
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link href="/momentum" className="hi-fi-cta-ghost">
                Voir un exemple de dossier
              </Link>
            </div>

            <ul className="hi-fi-hero-stats" aria-label="Indicateurs clés">
              <li>
                <strong style={{ color: HI_FI_ACCENTS.teal.color }}>~25s</strong>
                <span>Génération complète</span>
              </li>
              <li>
                <strong>14+</strong>
                <span>Sections produites</span>
              </li>
              <li>
                <strong>3</strong>
                <span>Modules intégrés</span>
              </li>
            </ul>
          </div>

          {/* Aperçu produit flottant */}
          <aside
            className="hi-fi-hero-preview hi-fi-float"
            aria-label="Aperçu de l'interface Stratly"
          >
            <div className="hi-fi-hero-preview-bar">
              <Logo variant="full" size={18} />
              <div className="hi-fi-hero-preview-bar-dots" aria-hidden="true">
                <span style={{ background: HI_FI_ACCENTS.orange.color }} />
                <span style={{ background: HI_FI_ACCENTS.amber.color }} />
                <span style={{ background: HI_FI_ACCENTS.green.color }} />
              </div>
            </div>

            {[
              {
                accent: HI_FI_ACCENTS.teal,
                label: "Déploiement ERP Région Sud",
                badge: "Généré",
                ago: "il y a 12 min",
              },
              {
                accent: HI_FI_ACCENTS.green,
                label: "Lancement politique RSE 2025",
                badge: "Validé",
                ago: "il y a 2j",
              },
              {
                accent: HI_FI_ACCENTS.violet,
                label: "Séminaire direction commerciale",
                badge: "En revue",
                ago: "il y a 5j",
              },
            ].map((p) => (
              <div key={p.label} className="hi-fi-hero-preview-row">
                <span
                  className="hi-fi-hero-preview-row-accent"
                  style={{ background: p.accent.color }}
                  aria-hidden="true"
                />
                <div className="hi-fi-hero-preview-row-body">
                  <div className="hi-fi-hero-preview-row-title">{p.label}</div>
                  <div className="hi-fi-hero-preview-row-meta">
                    Campaign · {p.ago}
                  </div>
                </div>
                <span
                  className="hi-fi-hero-preview-row-badge"
                  style={{ background: p.accent.bg, color: p.accent.color }}
                >
                  {p.badge}
                </span>
              </div>
            ))}

            <div className="hi-fi-hero-preview-nba">
              <span
                className="hi-fi-hero-preview-nba-icon"
                aria-hidden="true"
                style={{ background: HI_FI_ACCENTS.amber.ring }}
              />
              <div>
                <span className="hi-fi-hero-preview-nba-overline">
                  Prochaine action recommandée
                </span>
                <span className="hi-fi-hero-preview-nba-title">
                  Enrichir le projet RSE avec le module Impact
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Modules (Hi-Fi) — 6 cartes colorées ──────── */}
      <section className="hi-fi-features" id="modules">
        <div className="hi-fi-features-inner">
          <div className="hi-fi-section-head">
            <p className="hi-fi-overline">Modules Stratly</p>
            <h2 className="hi-fi-section-title">
              Tout ce qu&apos;une direction stratégique
              <br />
              attend d&apos;une plateforme IA
            </h2>
            <p className="hi-fi-section-lead">
              Assez générique pour démarrer vite. Assez spécifique pour livrer
              des recommandations qui tiennent en CODIR.
            </p>
          </div>

          <div className="hi-fi-features-grid">
            {[
              {
                accent: HI_FI_ACCENTS.teal,
                title: "Campaign",
                desc: "Brief en 6 champs → dossier stratégique structuré : diagnostic, angle, feuille de route, KPIs, contenus prêts à diffuser.",
                illu: <IlluBrief />,
              },
              {
                accent: HI_FI_ACCENTS.violet,
                title: "Orchestrateur multi-agents",
                desc: "Conception créative, design d'événement, ROI, budget, carbone, risques — un orchestrateur route automatiquement vers l'agent expert.",
                illu: <IlluNetwork />,
              },
              {
                accent: HI_FI_ACCENTS.green,
                title: "Collaboration DirCom-ready",
                desc: "Statuts par section (brouillon / revue / validé), commentaires ciblés, vue dédiée CODIR, partage via lien sécurisé.",
                illu: <IlluCollab />,
              },
              {
                accent: HI_FI_ACCENTS.orange,
                title: "Exports prêts à présenter",
                desc: "PDF premium paginé et DOCX éditable — couverture, sommaire, blocs décision, timeline, KPIs. Téléchargement en un clic.",
                illu: <IlluPresentation />,
              },
              {
                accent: HI_FI_ACCENTS.blue,
                title: "Pilot",
                desc: "Diagnostic continu, suivi des KPIs, mesure d'impact et recommandations proactives pour chaque étape de votre projet.",
                illu: <IlluDashboard />,
              },
              {
                accent: HI_FI_ACCENTS.amber,
                title: "Impact",
                desc: "Empreinte carbone, scénarios RSE, recommandations d'arbitrages — conforme aux exigences ESG des grands groupes.",
                illu: <IlluStrategy />,
              },
            ].map((f) => (
              <article key={f.title} className="hi-fi-feature-card">
                <div
                  className="hi-fi-feature-illu"
                  style={{
                    background: `${f.accent.color}0d`,
                    borderBottomColor: `${f.accent.color}28`,
                  }}
                >
                  {f.illu}
                </div>
                <div className="hi-fi-feature-body">
                  <h3 className="hi-fi-feature-title">{f.title}</h3>
                  <p className="hi-fi-feature-desc">{f.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow (Hi-Fi dark navy) — 4 étapes ──────── */}
      <section className="hi-fi-workflow">
        <div className="hi-fi-workflow-bg" aria-hidden="true" />
        <div className="hi-fi-workflow-inner">
          <div className="hi-fi-section-head">
            <span className="hi-fi-workflow-pill">Flux de travail</span>
            <h2 className="hi-fi-section-title hi-fi-section-title-light">
              Du brief informel au dossier validé —
              <br />
              en un seul flux
            </h2>
            <p className="hi-fi-section-lead hi-fi-section-lead-light">
              Pas de context-switching. Chaque étape nourrit la suivante,
              sans re-saisie.
            </p>
          </div>

          <div className="hi-fi-workflow-grid">
            {[
              {
                num: "01",
                title: "Déposer le brief",
                desc: "6 champs structurés ou upload d'un document. Extraction automatique des constantes.",
                illu: <IlluBrief />,
                accent: HI_FI_ACCENTS.teal,
              },
              {
                num: "02",
                title: "Génération orchestrée",
                desc: "L'orchestrateur appelle les agents en chaîne — diagnostic, angle, plan, KPIs, contenus.",
                illu: <IlluNetwork />,
                accent: HI_FI_ACCENTS.violet,
              },
              {
                num: "03",
                title: "Revue & collaboration",
                desc: "Itérez sur chaque section avec commentaires ciblés et statuts de validation.",
                illu: <IlluCollab />,
                accent: HI_FI_ACCENTS.green,
              },
              {
                num: "04",
                title: "Présentation CODIR",
                desc: "Export PDF/DOCX premium ou partage par lien — prêt pour direction et prestataires.",
                illu: <IlluPresentation />,
                accent: HI_FI_ACCENTS.orange,
              },
            ].map((s) => (
              <article key={s.num} className="hi-fi-workflow-card">
                <div
                  className="hi-fi-workflow-illu"
                  style={{
                    background: `${s.accent.color}1a`,
                    borderBottomColor: `${s.accent.color}30`,
                  }}
                >
                  {s.illu}
                </div>
                <div className="hi-fi-workflow-body">
                  <div
                    className="hi-fi-workflow-num"
                    style={{ color: s.accent.color }}
                  >
                    {s.num}
                  </div>
                  <h3 className="hi-fi-workflow-title">{s.title}</h3>
                  <p className="hi-fi-workflow-desc">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Livrables / preuves concrètes ──────────────── */}
      <section
        className="landing-deliverables"
        id="livrables"
        aria-label="Ce que vous obtenez"
      >
        <div className="landing-deliverables-inner">
          <div className="landing-deliverables-head">
            <p className="landing-deliverables-overline">
              Concrètement, vous repartez avec
            </p>
            <h2 className="landing-deliverables-title">
              Des livrables exploitables{" "}
              <span className="landing-deliverables-title-soft">
                — pas des slides théoriques.
              </span>
            </h2>
            <p className="landing-deliverables-lead">
              Chaque module produit des sorties tangibles, exportables et
              défendables face à un COMEX.
            </p>
          </div>

          <div className="landing-deliverables-grid">
            {/* 01 — Plan stratégique */}
            <article className="landing-deliverable">
              <div className="landing-deliverable-preview">
                <svg
                  viewBox="0 0 240 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="landing-deliverable-mockup"
                >
                  <rect
                    x="32"
                    y="14"
                    width="176"
                    height="146"
                    rx="10"
                    fill="#fff"
                    stroke="#E2EAF4"
                  />
                  <rect x="46" y="28" width="60" height="6" rx="3" fill="#6366F1" />
                  <rect x="46" y="40" width="40" height="4" rx="2" fill="#CBD5E1" />
                  <rect x="46" y="56" width="148" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="46" y="63" width="124" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="46" y="70" width="138" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="46" y="84" width="44" height="14" rx="3" fill="#EEF2FF" />
                  <rect x="94" y="84" width="44" height="14" rx="3" fill="#EEF2FF" />
                  <rect x="46" y="106" width="148" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="46" y="113" width="116" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="46" y="120" width="138" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="46" y="138" width="60" height="10" rx="3" fill="#6366F1" />
                </svg>
              </div>
              <div className="landing-deliverable-body">
                <span className="landing-deliverable-tag">
                  Document · Multi-section
                </span>
                <h3 className="landing-deliverable-title">
                  Plan stratégique complet
                </h3>
                <p className="landing-deliverable-desc">
                  Angle éditorial, messages, dispositif, planning — un dossier
                  structuré, prêt à défendre en interne.
                </p>
                <span className="landing-deliverable-source">
                  via Campaign
                </span>
              </div>
            </article>

            {/* 02 — Contenus calibrés */}
            <article className="landing-deliverable">
              <div className="landing-deliverable-preview">
                <svg
                  viewBox="0 0 240 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="landing-deliverable-mockup"
                >
                  <rect
                    x="22"
                    y="22"
                    width="140"
                    height="58"
                    rx="10"
                    fill="#fff"
                    stroke="#E2EAF4"
                  />
                  <rect x="34" y="34" width="44" height="10" rx="3" fill="#EEF2FF" />
                  <rect x="34" y="52" width="116" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="34" y="59" width="92" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="34" y="66" width="104" height="3" rx="1.5" fill="#E2EAF4" />

                  <rect
                    x="78"
                    y="86"
                    width="140"
                    height="58"
                    rx="10"
                    fill="#fff"
                    stroke="#E2EAF4"
                  />
                  <rect x="90" y="98" width="52" height="10" rx="3" fill="#E0E7FF" />
                  <rect x="90" y="116" width="116" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="90" y="123" width="92" height="3" rx="1.5" fill="#E2EAF4" />
                  <rect x="90" y="130" width="80" height="3" rx="1.5" fill="#E2EAF4" />
                </svg>
              </div>
              <div className="landing-deliverable-body">
                <span className="landing-deliverable-tag">
                  Activable · Par audience
                </span>
                <h3 className="landing-deliverable-title">
                  Contenus rédigés, calibrés
                </h3>
                <p className="landing-deliverable-desc">
                  Messages clés et formats prêts à pousser sur vos canaux —
                  ajustés à chaque audience cible.
                </p>
                <span className="landing-deliverable-source">
                  via Campaign
                </span>
              </div>
            </article>

            {/* 03 — Diagnostic radar */}
            <article className="landing-deliverable">
              <div className="landing-deliverable-preview">
                <svg
                  viewBox="0 0 240 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="landing-deliverable-mockup"
                >
                  {/* Radar grid */}
                  <g transform="translate(86 80)">
                    <polygon
                      points="0,-58 50,-29 50,29 0,58 -50,29 -50,-29"
                      fill="none"
                      stroke="#E2EAF4"
                      strokeWidth="1"
                    />
                    <polygon
                      points="0,-39 33,-19 33,19 0,39 -33,19 -33,-19"
                      fill="none"
                      stroke="#E2EAF4"
                      strokeWidth="1"
                    />
                    <polygon
                      points="0,-20 17,-10 17,10 0,20 -17,10 -17,-10"
                      fill="none"
                      stroke="#E2EAF4"
                      strokeWidth="1"
                    />
                    <line x1="0" y1="-58" x2="0" y2="58" stroke="#E2EAF4" />
                    <line x1="-50" y1="-29" x2="50" y2="29" stroke="#E2EAF4" />
                    <line x1="-50" y1="29" x2="50" y2="-29" stroke="#E2EAF4" />
                    {/* Filled radar */}
                    <polygon
                      points="0,-46 42,-22 38,18 0,40 -34,16 -40,-22"
                      fill="rgba(99,102,241,0.18)"
                      stroke="#6366F1"
                      strokeWidth="1.5"
                    />
                    <circle cx="0" cy="-46" r="3" fill="#6366F1" />
                    <circle cx="42" cy="-22" r="3" fill="#6366F1" />
                    <circle cx="38" cy="18" r="3" fill="#6366F1" />
                    <circle cx="0" cy="40" r="3" fill="#6366F1" />
                    <circle cx="-34" cy="16" r="3" fill="#6366F1" />
                    <circle cx="-40" cy="-22" r="3" fill="#6366F1" />
                  </g>
                  {/* Score panel */}
                  <rect
                    x="166"
                    y="42"
                    width="58"
                    height="76"
                    rx="10"
                    fill="#fff"
                    stroke="#E2EAF4"
                  />
                  <rect x="176" y="54" width="30" height="4" rx="2" fill="#CBD5E1" />
                  <text
                    x="195"
                    y="86"
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="700"
                    fill="#4F46E5"
                    fontFamily="DM Sans, sans-serif"
                  >
                    78
                  </text>
                  <rect x="176" y="100" width="38" height="3" rx="1.5" fill="#EEF2FF" />
                  <rect x="176" y="106" width="26" height="3" rx="1.5" fill="#EEF2FF" />
                </svg>
              </div>
              <div className="landing-deliverable-body">
                <span className="landing-deliverable-tag">
                  Mesure · 4 dimensions
                </span>
                <h3 className="landing-deliverable-title">
                  Diagnostic + score consolidé
                </h3>
                <p className="landing-deliverable-desc">
                  Une lecture objective de la performance, avec indicateurs de
                  fiabilité par mesure et actions correctives priorisées.
                </p>
                <span className="landing-deliverable-source">via Pilot</span>
              </div>
            </article>

            {/* 04 — Rapport COMEX */}
            <article className="landing-deliverable">
              <div className="landing-deliverable-preview">
                <svg
                  viewBox="0 0 240 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="landing-deliverable-mockup"
                >
                  <rect
                    x="32"
                    y="14"
                    width="176"
                    height="146"
                    rx="10"
                    fill="#fff"
                    stroke="#E2EAF4"
                  />
                  <rect x="46" y="28" width="80" height="6" rx="3" fill="#0F172A" />
                  <rect x="46" y="40" width="44" height="4" rx="2" fill="#CBD5E1" />
                  {/* KPI tiles */}
                  <rect x="46" y="56" width="68" height="40" rx="6" fill="#F6F7FB" />
                  <rect x="56" y="64" width="28" height="3" rx="1.5" fill="#CBD5E1" />
                  <text
                    x="56"
                    y="86"
                    fontSize="14"
                    fontWeight="700"
                    fill="#4F46E5"
                    fontFamily="DM Sans, sans-serif"
                  >
                    +24%
                  </text>
                  <rect x="122" y="56" width="72" height="40" rx="6" fill="#F6F7FB" />
                  <rect x="132" y="64" width="32" height="3" rx="1.5" fill="#CBD5E1" />
                  <text
                    x="132"
                    y="86"
                    fontSize="14"
                    fontWeight="700"
                    fill="#0F172A"
                    fontFamily="DM Sans, sans-serif"
                  >
                    78/100
                  </text>
                  {/* Mini bar chart */}
                  <rect x="46" y="106" width="148" height="44" rx="6" fill="#F6F7FB" />
                  <rect x="58" y="138" width="10" height="6" rx="2" fill="#C7D2FE" />
                  <rect x="74" y="130" width="10" height="14" rx="2" fill="#C7D2FE" />
                  <rect x="90" y="120" width="10" height="24" rx="2" fill="#A5B4FC" />
                  <rect x="106" y="124" width="10" height="20" rx="2" fill="#A5B4FC" />
                  <rect x="122" y="116" width="10" height="28" rx="2" fill="#818CF8" />
                  <rect x="138" y="112" width="10" height="32" rx="2" fill="#6366F1" />
                  <rect x="154" y="120" width="10" height="24" rx="2" fill="#6366F1" />
                  <rect x="170" y="118" width="10" height="26" rx="2" fill="#4F46E5" />
                </svg>
              </div>
              <div className="landing-deliverable-body">
                <span className="landing-deliverable-tag">
                  Export · PDF prêt COMEX
                </span>
                <h3 className="landing-deliverable-title">
                  Rapport consolidé exportable
                </h3>
                <p className="landing-deliverable-desc">
                  Un dossier final qui agrège design, performance et impact
                  RSE — projetable en réunion sans retraitement.
                </p>
                <span className="landing-deliverable-source">
                  via Pilot + Impact
                </span>
              </div>
            </article>
          </div>

          <p className="landing-deliverables-foot">
            Tous les livrables sont versionnés, exportables et signés — vous
            restez propriétaire des contenus produits.
          </p>
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

      {/* ── FAQ courte ─────────────────────────────────── */}
      <section className="landing-faq" aria-label="Questions fréquentes">
        <div className="landing-faq-inner">
          <div className="landing-faq-head">
            <p className="landing-faq-overline">Questions fréquentes</p>
            <h2 className="landing-faq-title">
              Les réponses{" "}
              <span className="landing-faq-title-soft">avant de commencer.</span>
            </h2>
          </div>
          <div className="landing-faq-grid">
            {FAQ.map((item) => (
              <div key={item.q} className="landing-faq-item">
                <h3 className="landing-faq-q">{item.q}</h3>
                <p className="landing-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — 2 parcours selon maturité ──────── */}
      <section
        id="cta-final"
        className="landing-final-paths"
        aria-label="Comment démarrer"
      >
        <div className="landing-final-paths-inner">
          <div className="landing-final-paths-head">
            <p className="landing-final-paths-overline">Comment démarrer</p>
            <h2 className="landing-final-paths-title">
              Deux parcours,{" "}
              <span className="landing-final-paths-title-soft">
                selon votre maturité.
              </span>
            </h2>
            <p className="landing-final-paths-lead">
              Tester par vous-même, ou cadrer votre cas avec un consultant
              Stratly. Vous restez maître du tempo.
            </p>
          </div>

          <div className="landing-final-paths-grid">
            {/* Parcours 1 — Self-serve */}
            <article className="landing-final-path landing-final-path-primary">
              <div className="landing-final-path-head">
                <span className="landing-final-path-tag">
                  <PlayCircle size={13} strokeWidth={1.8} />
                  Self-serve · Sans engagement
                </span>
                <h3 className="landing-final-path-title">
                  Testez par vous-même
                </h3>
                <p className="landing-final-path-desc">
                  Vous explorez la plateforme à votre rythme. Lancez un brief
                  test ou un diagnostic réel, gardez la main sur vos contenus.
                </p>
              </div>

              <ul className="landing-final-path-bullets">
                <li>
                  <span className="landing-final-path-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Accès complet aux 3 modules
                </li>
                <li>
                  <span className="landing-final-path-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Premier livrable en moins de 5 minutes
                </li>
                <li>
                  <span className="landing-final-path-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Aucune carte bancaire requise
                </li>
              </ul>

              <Link
                href="/studio/new"
                className="landing-cta-primary landing-final-path-cta"
              >
                Démarrer gratuitement
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <p className="landing-final-path-foot">Mise en route immédiate.</p>
            </article>

            {/* Parcours 2 — Avec un expert */}
            <article className="landing-final-path landing-final-path-secondary">
              <div className="landing-final-path-head">
                <span className="landing-final-path-tag landing-final-path-tag-alt">
                  <CalendarCheck size={13} strokeWidth={1.8} />
                  Avec un expert · 20 min
                </span>
                <h3 className="landing-final-path-title">
                  Cadrons votre cas avec un consultant
                </h3>
                <p className="landing-final-path-desc">
                  20 minutes pour comprendre votre contexte, démontrer la
                  valeur sur un de vos cas, et proposer un cadrage adapté.
                </p>
              </div>

              <ul className="landing-final-path-bullets">
                <li>
                  <span className="landing-final-path-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Démo personnalisée sur votre périmètre
                </li>
                <li>
                  <span className="landing-final-path-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Réponses aux questions COMEX, RSE, sécurité
                </li>
                <li>
                  <span className="landing-final-path-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Cadrage et devis sur mesure
                </li>
              </ul>

              <Link
                href="mailto:contact@stratly.io?subject=Demande%20de%20d%C3%A9mo%20Stratly"
                className="landing-cta-secondary-dark landing-final-path-cta"
              >
                Réserver une démo
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <p className="landing-final-path-foot">
                Réponse sous 24 h ouvrées.
              </p>
            </article>
          </div>

          <p className="landing-final-paths-tertiary">
            Vous cherchez un cadre tarifaire entreprise ?{" "}
            <Link href="mailto:contact@stratly.io?subject=Tarifs%20entreprise%20Stratly">
              Demander une grille de tarifs
              <ArrowRight size={12} strokeWidth={2} />
            </Link>
          </p>

          <ul className="landing-final-trust" aria-label="Engagements Stratly">
            <li>
              <span className="landing-final-trust-icon" aria-hidden="true">
                <Lock size={12} strokeWidth={2} />
              </span>
              Données chiffrées · Hébergement Europe
            </li>
            <li className="landing-final-trust-divider" aria-hidden="true" />
            <li>
              <span className="landing-final-trust-icon" aria-hidden="true">
                <Timer size={12} strokeWidth={2} />
              </span>
              Mise en route en moins de 5 minutes
            </li>
            <li className="landing-final-trust-divider" aria-hidden="true" />
            <li>
              <span className="landing-final-trust-icon" aria-hidden="true">
                <FileCheck2 size={12} strokeWidth={2} />
              </span>
              Conforme RGPD · Vos contenus restent votre propriété
            </li>
          </ul>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Logo variant="full" size={28} href="/" />
          <div className="landing-footer-links">
            <Link href="/studio">Campaign</Link>
            <Link href="/momentum">Pilot</Link>
            <Link href="/momentum">Impact</Link>
          </div>
          <span>© {new Date().getFullYear()} Stratly</span>
        </div>
      </footer>
    </div>
  );
}
