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
    a: "Vos contenus restent votre propriété. Vos projets sont stockés dans une base de données hébergée en Europe, chiffrée au repos, accessible uniquement depuis votre compte. Vos briefs ne servent jamais à entraîner de modèles IA.",
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
    tagline: "L'impact extra-financier — intégré à Pilot.",
    deliverables: [
      "Piliers Environnement · Social · Gouvernance",
      "Indicateurs alignés CSRD",
      "Reporting COMEX exportable",
    ],
    href: "/momentum",
  },
];

const PROOF_POINTS = [
  { value: "< 5 min", label: "Premier livrable activable" },
  { value: "3 modules", label: "Conception · Mesure · Impact" },
  { value: "COMEX-ready", label: "Exports PDF & DOCX premium" },
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
              Pensé pour les directions communication
            </div>

            <h1 className="hi-fi-fade-up-2 hi-fi-hero-title">
              Un COMEX ne croit pas
              <br />
              les slides. Il croit les{" "}
              <em className="hi-fi-hero-accent">preuves</em>.
            </h1>

            <p className="hi-fi-fade-up-3 hi-fi-hero-sub">
              Stratly transforme vos briefs en stratégies argumentées et vos
              dispositifs en résultats mesurés. Concevez, pilotez, prouvez —
              sans cabinet, sans tableur, sans y passer vos nuits.
            </p>

            <div className="hi-fi-fade-up-3 hi-fi-hero-ctas">
              <Link href="/studio/new" className="hi-fi-cta-primary">
                Générer mon premier dossier
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link href="#livrables" className="hi-fi-cta-ghost">
                Voir ce que vous obtenez
              </Link>
            </div>

            <ul className="hi-fi-hero-stats" aria-label="Indicateurs clés">
              <li>
                <strong style={{ color: HI_FI_ACCENTS.teal.color }}>5 min</strong>
                <span>du brief au dossier COMEX</span>
              </li>
              <li>
                <strong>5 000 €</strong>
                <span>ce que facture un cabinet pour l&apos;équivalent</span>
              </li>
              <li>
                <strong>0 €</strong>
                <span>pendant la bêta</span>
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
            <p className="hi-fi-overline">La méthode Stratly</p>
            <h2 className="hi-fi-section-title">
              Concevoir. Mesurer.
              <br />
              Prouver.
            </h2>
            <p className="hi-fi-section-lead">
              Chaque recommandation est construite sur votre brief — vos
              enjeux, votre vocabulaire, vos contraintes. La différence entre
              un dossier qu&apos;on présente et un document qu&apos;on
              retravaille.
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
                title: "Moteur de génération structurée",
                desc: "Diagnostic, angle, dispositif, budget, risques — chaque section du dossier est générée selon un schéma strict, pour une structure toujours complète et exploitable.",
                illu: <IlluNetwork />,
              },
              {
                accent: HI_FI_ACCENTS.green,
                title: "Collaboration DirCom-ready",
                desc: "Statuts par section (brouillon / revue / validé), commentaires ciblés et vue dédiée CODIR pour préparer vos arbitrages.",
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

      {/* ── Livrables / preuves concrètes — Hi-Fi ───────── */}
      <section
        className="hi-fi-deliverables"
        id="livrables"
        aria-label="Ce que vous obtenez"
      >
        <div className="hi-fi-deliverables-inner">
          <div className="hi-fi-deliverables-head">
            <p className="hi-fi-deliverables-overline">
              Ce que vous obtenez
            </p>
            <h2 className="hi-fi-deliverables-title">
              Des livrables exploitables{" "}
              <em className="hi-fi-deliverables-title-soft">
                — pas des slides théoriques.
              </em>
            </h2>
            <p className="hi-fi-deliverables-lead">
              Chaque module produit des sorties tangibles, exportables et
              défendables face à un COMEX.
            </p>
          </div>

          <div className="hi-fi-deliverables-grid">
            {/* 01 — Plan stratégique */}
            <article
              className="hi-fi-deliverable"
              style={{ ["--card-accent" as string]: "var(--accent-teal)" }}
            >
              <div className="hi-fi-deliverable-preview">
                <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="hi-fi-deliverable-mockup">
                  <rect x="20" y="20" width="180" height="130" rx="12" fill="#00b4c8" opacity="0.12" />
                  <rect x="38" y="10" width="180" height="142" rx="10" fill="#fff" stroke="#D6E2EE" />
                  <path d="M38 20a10 10 0 0 1 10-10h160a10 10 0 0 1 10 10v26H38V20Z" fill="#0F172A" />
                  <rect x="52" y="22" width="76" height="7" rx="3.5" fill="#fff" opacity="0.92" />
                  <circle cx="202" cy="26" r="4" fill="#00b4c8" />
                  <rect x="52" y="56" width="40" height="13" rx="6.5" fill="#00b4c8" opacity="0.16" />
                  <rect x="98" y="56" width="40" height="13" rx="6.5" fill="#00b4c8" opacity="0.16" />
                  <rect x="144" y="56" width="40" height="13" rx="6.5" fill="#00b4c8" opacity="0.16" />
                  <rect x="52" y="80" width="152" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="52" y="90" width="126" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="52" y="100" width="140" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="52" y="114" width="152" height="20" rx="6" fill="#00b4c8" opacity="0.1" />
                  <rect x="52" y="114" width="4" height="20" rx="2" fill="#00b4c8" />
                  <rect x="64" y="121" width="96" height="5" rx="2.5" fill="#4E6E8C" />
                  <rect x="52" y="140" width="62" height="9" rx="4.5" fill="#00b4c8" />
                </svg>
              </div>
              <div className="hi-fi-deliverable-body">
                <span className="hi-fi-deliverable-tag">
                  Document · Multi-section
                </span>
                <h3 className="hi-fi-deliverable-title">
                  Plan stratégique complet
                </h3>
                <p className="hi-fi-deliverable-desc">
                  Angle éditorial, messages, dispositif, planning — un dossier
                  structuré, prêt à défendre en interne.
                </p>
                <span className="hi-fi-deliverable-source">via Campaign</span>
              </div>
            </article>

            {/* 02 — Contenus calibrés */}
            <article
              className="hi-fi-deliverable"
              style={{ ["--card-accent" as string]: "var(--accent-violet)" }}
            >
              <div className="hi-fi-deliverable-preview">
                <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="hi-fi-deliverable-mockup">
                  <circle cx="204" cy="34" r="26" fill="#7c5cbf" opacity="0.12" />
                  <rect x="16" y="18" width="152" height="66" rx="10" fill="#fff" stroke="#D6E2EE" />
                  <rect x="28" y="28" width="44" height="13" rx="6.5" fill="#7c5cbf" opacity="0.18" />
                  <circle cx="37" cy="62" r="8" fill="#7c5cbf" opacity="0.4" />
                  <rect x="52" y="52" width="100" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="52" y="62" width="78" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="70" y="66" width="154" height="76" rx="10" fill="#fff" stroke="#C9B8E8" strokeWidth="1.3" />
                  <rect x="84" y="78" width="48" height="14" rx="7" fill="#7c5cbf" />
                  <rect x="91" y="82.5" width="32" height="5" rx="2.5" fill="#fff" opacity="0.9" />
                  <circle cx="93" cy="114" r="8" fill="#f0b429" opacity="0.85" />
                  <rect x="108" y="104" width="102" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="108" y="114" width="84" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="108" y="124" width="94" height="5" rx="2.5" fill="#B9C9DA" />
                  <rect x="84" y="98" width="126" height="1.5" fill="#EDE7F8" />
                </svg>
              </div>
              <div className="hi-fi-deliverable-body">
                <span className="hi-fi-deliverable-tag">
                  Activable · Par audience
                </span>
                <h3 className="hi-fi-deliverable-title">
                  Contenus rédigés, calibrés
                </h3>
                <p className="hi-fi-deliverable-desc">
                  Messages clés et formats prêts à pousser sur vos canaux —
                  ajustés à chaque audience cible.
                </p>
                <span className="hi-fi-deliverable-source">via Campaign</span>
              </div>
            </article>

            {/* 03 — Diagnostic radar */}
            <article
              className="hi-fi-deliverable"
              style={{ ["--card-accent" as string]: "var(--accent-orange)" }}
            >
              <div className="hi-fi-deliverable-preview">
                <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="hi-fi-deliverable-mockup">
                  <g transform="translate(84 80)">
                    <polygon points="0,-58 54,0 0,58 -54,0" fill="none" stroke="#C6D5E4" strokeWidth="1" />
                    <polygon points="0,-39 36,0 0,39 -36,0" fill="none" stroke="#C6D5E4" strokeWidth="1" />
                    <polygon points="0,-20 18,0 0,20 -18,0" fill="none" stroke="#C6D5E4" strokeWidth="1" />
                    <line x1="0" y1="-58" x2="0" y2="58" stroke="#C6D5E4" />
                    <line x1="-54" y1="0" x2="54" y2="0" stroke="#C6D5E4" />
                    <polygon points="0,-50 46,0 0,40 -36,0" fill="#7c5cbf" opacity="0.22" />
                    <polygon points="0,-50 46,0 0,40 -36,0" fill="none" stroke="#7c5cbf" strokeWidth="2" strokeLinejoin="round" />
                    <circle cx="0" cy="-50" r="3.5" fill="#7c5cbf" />
                    <circle cx="46" cy="0" r="3.5" fill="#f05a28" />
                    <circle cx="0" cy="40" r="3.5" fill="#7c5cbf" />
                    <circle cx="-36" cy="0" r="3.5" fill="#7c5cbf" />
                  </g>
                  <rect x="158" y="36" width="66" height="88" rx="10" fill="#0F172A" />
                  <rect x="170" y="48" width="34" height="4.5" rx="2.25" fill="#fff" opacity="0.5" />
                  <text x="191" y="90" textAnchor="middle" fontSize="26" fontWeight="700" fill="#fff" fontFamily="DM Sans, sans-serif">81</text>
                  <rect x="170" y="100" width="42" height="4" rx="2" fill="#f0b429" />
                  <circle cx="174" cy="113" r="3" fill="#2db87a" />
                  <rect x="181" y="110.5" width="31" height="5" rx="2.5" fill="#fff" opacity="0.35" />
                  <rect x="158" y="130" width="66" height="4" rx="2" fill="#f05a28" opacity="0.85" />
                </svg>
              </div>
              <div className="hi-fi-deliverable-body">
                <span className="hi-fi-deliverable-tag">
                  Mesure · 4 dimensions
                </span>
                <h3 className="hi-fi-deliverable-title">
                  Diagnostic + score consolidé
                </h3>
                <p className="hi-fi-deliverable-desc">
                  Une lecture objective de la performance, avec indicateurs de
                  fiabilité par mesure et actions correctives priorisées.
                </p>
                <span className="hi-fi-deliverable-source">via Pilot</span>
              </div>
            </article>

            {/* 04 — Rapport COMEX */}
            <article
              className="hi-fi-deliverable"
              style={{ ["--card-accent" as string]: "var(--accent-green)" }}
            >
              <div className="hi-fi-deliverable-preview">
                <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="hi-fi-deliverable-mockup">
                  <rect x="28" y="8" width="184" height="144" rx="10" fill="#fff" stroke="#D6E2EE" />
                  <path d="M28 18a10 10 0 0 1 10-10h164a10 10 0 0 1 10 10v22H28V18Z" fill="#0F172A" />
                  <rect x="42" y="19" width="68" height="7" rx="3.5" fill="#fff" opacity="0.92" />
                  <circle cx="197" cy="24" r="7" fill="#2db87a" />
                  <path d="M193.5 24l2.4 2.4 4.6-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <rect x="42" y="50" width="76" height="34" rx="6" fill="#F0F5FA" stroke="#E1EAF3" />
                  <rect x="50" y="58" width="30" height="4" rx="2" fill="#9FB4C8" />
                  <text x="50" y="78" fontSize="14" fontWeight="700" fill="#2db87a" fontFamily="DM Sans, sans-serif">+24%</text>
                  <rect x="126" y="50" width="72" height="34" rx="6" fill="#F0F5FA" stroke="#E1EAF3" />
                  <rect x="134" y="58" width="34" height="4" rx="2" fill="#9FB4C8" />
                  <text x="134" y="78" fontSize="14" fontWeight="700" fill="#0F172A" fontFamily="DM Sans, sans-serif">81/100</text>
                  <rect x="42" y="94" width="156" height="48" rx="6" fill="#F0F5FA" />
                  <rect x="54" y="124" width="10" height="10" rx="2" fill="#7ccfdc" />
                  <rect x="70" y="118" width="10" height="16" rx="2" fill="#4cc3d4" />
                  <rect x="86" y="112" width="10" height="22" rx="2" fill="#00b4c8" />
                  <rect x="102" y="116" width="10" height="18" rx="2" fill="#00b4c8" />
                  <rect x="118" y="108" width="10" height="26" rx="2" fill="#63cfa4" />
                  <rect x="134" y="102" width="10" height="32" rx="2" fill="#2db87a" />
                  <rect x="150" y="110" width="10" height="24" rx="2" fill="#2db87a" />
                  <rect x="166" y="100" width="10" height="34" rx="2" fill="#1e9c66" />
                  <rect x="54" y="134" width="132" height="2" fill="#D6E2EE" />
                </svg>
              </div>
              <div className="hi-fi-deliverable-body">
                <span className="hi-fi-deliverable-tag">
                  Export · PDF prêt COMEX
                </span>
                <h3 className="hi-fi-deliverable-title">
                  Rapport consolidé exportable
                </h3>
                <p className="hi-fi-deliverable-desc">
                  Un dossier final qui agrège design, performance et impact
                  RSE — projetable en réunion sans retraitement.
                </p>
                <span className="hi-fi-deliverable-source">
                  via Pilot + Impact
                </span>
              </div>
            </article>
          </div>

          <p className="hi-fi-deliverables-foot">
            Tous les livrables sont exportables en PDF et DOCX — vous restez
            propriétaire des contenus produits.
          </p>

          <p style={{ textAlign: "center", marginTop: 20 }}>
            <a
              href="/exemples/dossier-exemple.pdf"
              target="_blank"
              rel="noopener"
              className="hi-fi-cta-primary"
              style={{ display: "inline-flex" }}
            >
              Voir un dossier exemple (PDF)
              <ArrowRight size={16} strokeWidth={2} />
            </a>
          </p>
        </div>
      </section>

      {/* ── Social proof — Hi-Fi ────────────────────────── */}
      <section className="hi-fi-proof" aria-label="Chiffres clés">
        <div className="hi-fi-proof-inner">
          {PROOF_POINTS.map(({ value, label }, i) => (
            <div key={value} className="hi-fi-proof-item">
              <p
                className="hi-fi-proof-value"
                style={{
                  color:
                    i === 0
                      ? "var(--accent-teal)"
                      : i === 1
                        ? "var(--accent-violet)"
                        : "var(--accent-green)",
                }}
              >
                {value}
              </p>
              <p className="hi-fi-proof-label">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ courte — Hi-Fi ──────────────────────────── */}
      <section className="hi-fi-faq" aria-label="Questions fréquentes">
        <div className="hi-fi-faq-inner">
          <div className="hi-fi-faq-head">
            <p className="hi-fi-faq-overline">Questions fréquentes</p>
            <h2 className="hi-fi-faq-title">
              Les réponses{" "}
              <em className="hi-fi-faq-title-soft">avant de commencer.</em>
            </h2>
          </div>
          <div className="hi-fi-faq-grid">
            {FAQ.map((item) => (
              <div key={item.q} className="hi-fi-faq-item">
                <h3 className="hi-fi-faq-q">{item.q}</h3>
                <p className="hi-fi-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — 2 parcours selon maturité — Hi-Fi ─ */}
      <section
        id="cta-final"
        className="hi-fi-cta"
        aria-label="Comment démarrer"
      >
        <span className="hi-fi-cta-halo" aria-hidden="true" />
        <div className="hi-fi-cta-inner">
          <div className="hi-fi-cta-head">
            <p className="hi-fi-cta-overline">Comment démarrer</p>
            <h2 className="hi-fi-cta-title">
              Deux façons{" "}
              <em className="hi-fi-cta-title-soft">
                de vous convaincre.
              </em>
            </h2>
            <p className="hi-fi-cta-lead">
              Tester par vous-même, ou cadrer votre cas avec un consultant
              Stratly. Vous restez maître du tempo.
            </p>
          </div>

          <div className="hi-fi-cta-grid">
            {/* Parcours 1 — Self-serve (primaire, navy gradient) */}
            <article className="hi-fi-cta-card hi-fi-cta-card-primary">
              <span className="hi-fi-cta-card-halo" aria-hidden="true" />
              <div className="hi-fi-cta-card-head">
                <span className="hi-fi-cta-card-tag">
                  <PlayCircle size={13} strokeWidth={1.8} />
                  Self-serve · Sans engagement
                </span>
                <h3 className="hi-fi-cta-card-title">
                  Testez par vous-même
                </h3>
                <p className="hi-fi-cta-card-desc">
                  Lancez un brief réel, gardez la main sur vos contenus,
                  basculez vers Pilot dès que vous voulez objectiver l'impact.
                </p>
              </div>

              <ul className="hi-fi-cta-card-bullets">
                <li>
                  <span className="hi-fi-cta-card-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Accès complet aux 3 modules
                </li>
                <li>
                  <span className="hi-fi-cta-card-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Premier livrable en moins de 5 minutes
                </li>
                <li>
                  <span className="hi-fi-cta-card-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Aucune carte bancaire requise
                </li>
              </ul>

              <Link href="/studio/new" className="hi-fi-cta-card-btn">
                Démarrer gratuitement
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <p className="hi-fi-cta-card-foot">Mise en route immédiate.</p>
            </article>

            {/* Parcours 2 — Avec un expert (secondaire, accent teal) */}
            <article
              className="hi-fi-cta-card hi-fi-cta-card-secondary"
              style={{ ["--card-accent" as string]: "var(--accent-teal)" }}
            >
              <div className="hi-fi-cta-card-head">
                <span className="hi-fi-cta-card-tag hi-fi-cta-card-tag-secondary">
                  <CalendarCheck size={13} strokeWidth={1.8} />
                  Avec un expert · 20 min
                </span>
                <h3 className="hi-fi-cta-card-title">
                  Cadrons votre cas avec un consultant
                </h3>
                <p className="hi-fi-cta-card-desc">
                  20 minutes pour comprendre votre contexte, démontrer la
                  valeur sur un de vos cas, et proposer un cadrage adapté.
                </p>
              </div>

              <ul className="hi-fi-cta-card-bullets">
                <li>
                  <span className="hi-fi-cta-card-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Démo personnalisée sur votre périmètre
                </li>
                <li>
                  <span className="hi-fi-cta-card-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Réponses aux questions COMEX, RSE, sécurité
                </li>
                <li>
                  <span className="hi-fi-cta-card-check" aria-hidden="true">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  Cadrage et devis sur mesure
                </li>
              </ul>

              <Link
                href="mailto:contact@stratly.pro?subject=Demande%20de%20d%C3%A9mo%20Stratly"
                className="hi-fi-cta-card-btn hi-fi-cta-card-btn-secondary"
              >
                Réserver une démo
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <p className="hi-fi-cta-card-foot">
                Réponse sous 24 h ouvrées.
              </p>
            </article>
          </div>

          <p className="hi-fi-cta-tertiary">
            Vous cherchez un cadre tarifaire entreprise ?{" "}
            <Link href="mailto:contact@stratly.pro?subject=Tarifs%20entreprise%20Stratly">
              Demander une grille de tarifs
              <ArrowRight size={12} strokeWidth={2} />
            </Link>
          </p>

          <ul className="hi-fi-cta-trust" aria-label="Engagements Stratly">
            <li>
              <span className="hi-fi-cta-trust-icon" aria-hidden="true">
                <Lock size={12} strokeWidth={2} />
              </span>
              Hébergement Europe · Données chiffrées au repos
            </li>
            <li className="hi-fi-cta-trust-divider" aria-hidden="true" />
            <li>
              <span className="hi-fi-cta-trust-icon" aria-hidden="true">
                <Timer size={12} strokeWidth={2} />
              </span>
              Mise en route en moins de 5 minutes
            </li>
            <li className="hi-fi-cta-trust-divider" aria-hidden="true" />
            <li>
              <span className="hi-fi-cta-trust-icon" aria-hidden="true">
                <FileCheck2 size={12} strokeWidth={2} />
              </span>
              Vos contenus restent votre propriété · Jamais utilisés pour entraîner l&apos;IA
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
