"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles, X } from "lucide-react";

import { LandingHeaderNav } from "../_components/landing-header-nav";

type Cycle = "monthly" | "annual";

const PRO_MONTHLY = 149;
const PRO_ANNUAL_MONTHLY_EQUIV = 124; // 1490 / 12 ≈ 124,17 → arrondi spec
const PRO_ANNUAL_TOTAL = 1490;
const ENT_FROM = 490;

const STARTER_BULLETS = [
  "1 projet/mois par module",
  "Campaign",
  "Pilot",
  "Module Impact",
  "Export PDF",
  "Support communauté",
];

const PRO_BULLETS = [
  "Projets illimités sur les 3 modules",
  "Campaign illimité",
  "Pilot illimité",
  "Module Impact illimité",
  "Historique multi-projets",
  "Rapport COMEX auto-généré",
  "Export PDF brandé Stratly",
  "Comparaison et courbes de progression",
  "Support prioritaire sous 24h",
  "1 utilisateur",
];

const ENT_BULLETS = [
  "Tout le Pro",
  "Jusqu'à 10 utilisateurs",
  "SSO et gestion des droits",
  "Onboarding dédié",
  "Support dédié sous 4h",
  "Formation équipe incluse",
  "Rapport d'usage mensuel",
];

type Row = {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
  ent: string | boolean;
};

const COMPARE_ROWS: Row[] = [
  { label: "Projets / mois", starter: "1", pro: "∞", ent: "∞" },
  { label: "3 modules (Campaign · Pilot · Impact)", starter: true, pro: true, ent: true },
  { label: "Historique multi-projets", starter: false, pro: true, ent: true },
  { label: "Rapport COMEX auto-généré", starter: false, pro: true, ent: true },
  { label: "Export PDF brandé Stratly", starter: false, pro: true, ent: true },
  { label: "Multi-utilisateurs", starter: false, pro: false, ent: true },
  { label: "Support dédié", starter: false, pro: false, ent: true },
  { label: "SSO entreprise", starter: false, pro: false, ent: true },
];

const FAQ = [
  {
    q: "Puis-je changer de formule à tout moment ?",
    a: "Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement est effectif immédiatement.",
  },
  {
    q: "Que se passe-t-il après les 14 jours d'essai ?",
    a: "Vous basculez automatiquement sur le Starter gratuit. Aucun prélèvement sans votre accord.",
  },
  {
    q: "Qu'est-ce qu'un projet ?",
    a: "Un projet correspond à une action de communication analysée — un événement, une campagne, une initiative RSE.",
  },
  {
    q: "Puis-je utiliser Stratly pour plusieurs entreprises ?",
    a: "L'offre Pro est prévue pour un utilisateur. Pour plusieurs entreprises ou équipes, contactez-nous pour une offre Entreprise adaptée.",
  },
  {
    q: "Vos données sont-elles sécurisées ?",
    a: "Oui. Stratly est conforme RGPD. Vos données ne sont jamais partagées ni utilisées pour entraîner des modèles IA.",
  },
];

export default function PricingPage() {
  const [cycle, setCycle] = useState<Cycle>("annual");

  return (
    <div className="landing-root" data-landing-page>
      {/* ── Header marketing — masque la topnav studio via :has() ── */}
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

      <main className="pricing-page-v2">
        <div className="pricing-shell">
        {/* Hero */}
        <header className="pricing-hero">
          <span className="pricing-eyebrow">
            <Sparkles size={13} strokeWidth={2.2} />
            Tarifs Stratly
          </span>
          <h1 className="pricing-title">
            Une plateforme unique. Trois modules. Un tarif clair.
          </h1>
          <p className="pricing-lead">
            Campaign, Pilot, Impact — accès aux trois modules, quel que soit
            votre plan. Vous payez la profondeur d&rsquo;usage, pas la
            fonctionnalité.
          </p>

          {/* Toggle */}
          <div className="pricing-toggle" role="tablist" aria-label="Cycle de facturation">
            <button
              type="button"
              className="pricing-toggle-btn"
              aria-pressed={cycle === "monthly"}
              onClick={() => setCycle("monthly")}
            >
              Mensuel
            </button>
            <button
              type="button"
              className="pricing-toggle-btn"
              aria-pressed={cycle === "annual"}
              onClick={() => setCycle("annual")}
            >
              Annuel
              <span className="pricing-toggle-save">2 mois offerts ✨</span>
            </button>
          </div>

          {/* Value anchor */}
          <p className="pricing-anchor">
            <strong>
              Un cabinet de conseil facture entre 5 000 € et 15 000 €
            </strong>{" "}
            pour produire ce que Stratly génère en 5 minutes.
          </p>
        </header>

        {/* 3 cards */}
        <div className="pricing-grid">
          {/* Starter */}
          <article className="pricing-card">
            <h2 className="pricing-card-name">Starter</h2>
            <p className="pricing-card-tagline">Pour découvrir Stratly</p>
            <div className="pricing-card-price">
              <span className="pricing-card-price-amount">0 €</span>
              <span className="pricing-card-price-cycle">/ pour toujours</span>
            </div>
            <div className="pricing-card-savings-empty" />
            <p className="pricing-card-forwho">
              Idéal pour tester sur un premier projet, sans engagement.
            </p>
            <ul className="pricing-card-bullets">
              {STARTER_BULLETS.map((b) => (
                <li key={b}>
                  <Check size={16} strokeWidth={2.4} className="pricing-card-check" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Link href="/studio/new" className="pricing-card-cta pricing-card-cta-outline">
              Commencer gratuitement
            </Link>
          </article>

          {/* Pro — featured */}
          <article className="pricing-card pricing-card-featured">
            <span className="pricing-card-badge">Le plus populaire</span>
            <h2 className="pricing-card-name">Pro</h2>
            <p className="pricing-card-tagline">Pour piloter en continu</p>
            <div className="pricing-card-price">
              <span className="pricing-card-price-amount">
                {cycle === "annual" ? `${PRO_ANNUAL_MONTHLY_EQUIV} €` : `${PRO_MONTHLY} €`}
              </span>
              <span className="pricing-card-price-cycle">/ mois</span>
            </div>
            {cycle === "annual" ? (
              <p className="pricing-card-savings">
                Facturé {PRO_ANNUAL_TOTAL.toLocaleString("fr-FR")} € / an —
                soit 2 mois offerts.
              </p>
            ) : (
              <div className="pricing-card-savings-empty" />
            )}
            <p className="pricing-card-forwho">
              Direction communication ou RSE qui veut industrialiser et mesurer.
            </p>
            <ul className="pricing-card-bullets">
              {PRO_BULLETS.map((b) => (
                <li key={b}>
                  <Check size={16} strokeWidth={2.4} className="pricing-card-check" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/studio/new?plan=pro&trial=14"
              className="pricing-card-cta pricing-card-cta-primary"
            >
              Essayer 14 jours gratuits
              <ArrowRight size={15} strokeWidth={2} />
            </Link>
            <p className="pricing-card-cta-foot">Aucune carte bancaire requise</p>
          </article>

          {/* Entreprise */}
          <article className="pricing-card">
            <h2 className="pricing-card-name">Entreprise</h2>
            <p className="pricing-card-tagline">Pour les équipes structurées</p>
            <div className="pricing-card-price">
              <span className="pricing-card-price-amount">À partir de {ENT_FROM} €</span>
              <span className="pricing-card-price-cycle">/ mois</span>
            </div>
            <p className="pricing-card-savings">Facturation annuelle</p>
            <p className="pricing-card-forwho">
              COMEX, équipes Communication & RSE multi-sites, contraintes de
              gouvernance.
            </p>
            <ul className="pricing-card-bullets">
              {ENT_BULLETS.map((b) => (
                <li key={b}>
                  <Check size={16} strokeWidth={2.4} className="pricing-card-check" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Link
              href="mailto:contact@stratly.io?subject=Stratly%20Entreprise%20—%20Demande%20d'information"
              className="pricing-card-cta pricing-card-cta-outline"
            >
              Nous contacter
            </Link>
          </article>
        </div>

        {/* Comparison table */}
        <section className="pricing-compare" aria-labelledby="pricing-compare-title">
          <h2 id="pricing-compare-title" className="pricing-compare-title">
            Comparer les formules
          </h2>
          <p className="pricing-compare-sub">
            Toutes les fonctions essentielles — vue d&rsquo;ensemble en un coup d&rsquo;œil.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="pricing-compare-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Starter</th>
                  <th className="pricing-compare-col-featured">Pro</th>
                  <th>Entreprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{renderCell(row.starter)}</td>
                    <td className="pricing-compare-col-featured">{renderCell(row.pro)}</td>
                    <td>{renderCell(row.ent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Guarantee */}
        <div className="pricing-guarantee" role="note">
          <span className="pricing-guarantee-icon" aria-hidden="true">
            <ShieldCheck size={22} strokeWidth={1.8} />
          </span>
          <p className="pricing-guarantee-text">
            <strong>Satisfait ou remboursé 30 jours</strong>
            sur votre premier mois — sans question.
          </p>
        </div>

        {/* FAQ */}
        <section className="pricing-faq" aria-labelledby="pricing-faq-title">
          <h2 id="pricing-faq-title" className="pricing-faq-title">
            Questions fréquentes
          </h2>
          <div className="pricing-faq-list">
            {FAQ.map((item) => (
              <div key={item.q} className="pricing-faq-item">
                <p className="pricing-faq-q">{item.q}</p>
                <p className="pricing-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final nudge */}
        <div className="pricing-final">
          <p>Une question avant de vous lancer ?</p>
          <Link
            href="mailto:contact@stratly.io?subject=Stratly%20—%20Question%20avant%20essai"
            className="pricing-card-cta pricing-card-cta-outline"
            style={{ width: "auto", display: "inline-flex" }}
          >
            Échanger avec l&rsquo;équipe
          </Link>
        </div>
        </div>
      </main>
    </div>
  );
}

function renderCell(value: string | boolean) {
  if (value === true) {
    return (
      <span className="pricing-compare-yes" aria-label="Inclus">
        <Check size={14} strokeWidth={2.6} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="pricing-compare-no" aria-label="Non inclus">
        <X size={16} strokeWidth={2} />
      </span>
    );
  }
  return <span style={{ fontWeight: 600, color: "#0F172A" }}>{value}</span>;
}
