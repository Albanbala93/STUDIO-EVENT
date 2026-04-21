"use client";

/**
 * Moteur de saisie conversationnel Momentum.
 *
 * Flux :
 *   Étape 1 — Identification du projet (5 questions guidées)
 *   Étape 2 — Collecte KPI par dimension (reach / engagement / appropriation / impact)
 *             Chaque KPI capture : valeur, provenance, confiance.
 *   Étape 3 — Revue & soumission → POST /kpis/interpret → affichage du diagnostic.
 *
 * Principes alignés sur KPI_FRAMEWORK.md :
 *   - Tout KPI déclare sa provenance (measured / estimated / declared / proxy).
 *   - La confiance (0-1) est propagée jusqu'au moteur de scoring.
 *   - Les KPIs inconnus deviennent des data_gaps — ils n'inventent pas de valeur.
 */

import { FormEvent, Suspense, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ResultDashboard } from "./dashboard";

/* ═══════════════════════════════════════════════════════════════════
   TYPES (alignés sur advanced_engine.DimensionSignal)
   ═══════════════════════════════════════════════════════════════════ */

type Provenance = "measured" | "declared" | "estimated" | "proxy";
type Dimension = "reach" | "engagement" | "appropriation" | "impact";
type ConfidenceLabel = "high" | "medium" | "low";
type InitiativeType =
  | "corporate_event"
  | "digital_campaign"
  | "change_management"
  | "newsletter"
  | "product_launch"
  | "other";

type IdentificationData = {
  name: string;
  initiativeType: InitiativeType | "";
  audienceType: string;
  audienceSize: number;
  intent: string;
};

type KPIAnswer = {
  kpiId: string;
  value: number;
  provenance: Provenance;
  confidenceLabel: ConfidenceLabel;
  note?: string;
};

type WizardState = {
  step: number; // 0 = intro ; 1-5 = identification ; 6+ = KPI ; -1 = review ; -2 = result
  id: IdentificationData;
  answers: Record<string, KPIAnswer>;
  submitting: boolean;
  apiError: string | null;
  diagnostic: DiagnosticPayload | null;
};

type WizardAction =
  | { type: "INTRO_NEXT" }
  | { type: "SET_ID"; patch: Partial<IdentificationData> }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GOTO"; step: number }
  | { type: "SAVE_ANSWER"; answer: KPIAnswer }
  | { type: "REMOVE_ANSWER"; kpiId: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; diagnostic: DiagnosticPayload }
  | { type: "SUBMIT_ERROR"; error: string; fallback: DiagnosticPayload }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: WizardState };

type InsightItem = { title: string; description: string };
type RecommendationItem = { title: string; action: string; priority: string };
type DataGapItem = { field: string; issue: string; impact: string };

type InterpretationPayload = {
  executive_summary: {
    headline: string;
    key_insight: string;
    top_strengths: string[];
    top_priorities: string[];
  };
  detailed_analysis: {
    summary: string;
    strengths: InsightItem[];
    weaknesses: InsightItem[];
    recommendations: RecommendationItem[];
    data_gaps: DataGapItem[];
  };
};

type KPIBreakdown = {
  kpi_id: string | null;
  value: number;
  confidence: number;
  contribution: number;
  provenance: Provenance;
};

type DimensionScoreData = {
  dimension: Dimension;
  score: number;
  confidence_score: number;
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  kpi_breakdown: KPIBreakdown[];
};

type ScoreResult = {
  overall_score: number;
  confidence_score: number;
  dimension_scores: DimensionScoreData[];
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  missing_dimensions: Dimension[];
};

type DiagnosticPayload = {
  score: ScoreResult;
  interpretation: InterpretationPayload;
};

/* ═══════════════════════════════════════════════════════════════════
   CATALOGUE CONVERSATIONNEL
   Traduit les IDs techniques du kpi_catalog en questions humaines.
   ═══════════════════════════════════════════════════════════════════ */

type KPIQuestion = {
  kpiId: string;
  dimension: Dimension;
  label: string;
  helper: string;
  unitHint: string;
  defaultProvenance: Provenance;
  min?: number;
  max?: number;
};

/** KPIs proposés selon le type d'initiative (repris de advanced_catalog.py).
 *
 *  Principe : 8-10 KPIs par type, répartis équitablement sur les 4 dimensions
 *  (Mobilisation / Implication / Compréhension / Impact) pour donner à l'API
 *  suffisamment de signaux pondérés et un radar lisible.
 *  L'utilisateur peut sauter ceux qu'il ne connaît pas — les skips deviennent
 *  des data_gaps, pas des zéros silencieux.
 */
const KPI_PLAN: Record<InitiativeType, KPIQuestion[]> = {
  corporate_event: [
    // Mobilisation (reach)
    { kpiId: "event.invitation_coverage_rate", dimension: "reach", label: "Couverture des invitations",
      helper: "Invités atteints / population cible initiale.",
      unitHint: "% — ex. 92", defaultProvenance: "measured" },
    { kpiId: "event.registration_rate", dimension: "reach", label: "Taux d'inscription",
      helper: "Inscrits / invités ayant reçu la convocation.",
      unitHint: "% — ex. 78", defaultProvenance: "measured" },
    { kpiId: "event.attendance_rate", dimension: "reach", label: "Taux de participation réel",
      helper: "Participants présents / participants inscrits.",
      unitHint: "% — ex. 72", defaultProvenance: "measured" },
    // Implication (engagement)
    { kpiId: "event.session_participation_rate", dimension: "engagement", label: "Participation aux sessions",
      helper: "Part des sessions suivies par rapport au programme total.",
      unitHint: "% — ex. 65", defaultProvenance: "measured" },
    { kpiId: "event.live_interaction_rate", dimension: "engagement", label: "Taux d'interaction en direct",
      helper: "Présents ayant posé une question, voté, ou interagi.",
      unitHint: "% — ex. 45", defaultProvenance: "measured" },
    { kpiId: "event.networking_rate", dimension: "engagement", label: "Taux de networking",
      helper: "Part des participants ayant échangé entre eux (apps, tables…).",
      unitHint: "% — ex. 35", defaultProvenance: "estimated" },
    // Compréhension (appropriation)
    { kpiId: "event.satisfaction_score", dimension: "appropriation", label: "Score de satisfaction",
      helper: "Note moyenne de satisfaction post-événement ramenée sur 100.",
      unitHint: "0-100 — ex. 66", defaultProvenance: "declared" },
    { kpiId: "event.memorization_score", dimension: "appropriation", label: "Score de mémorisation",
      helper: "Capacité à restituer les messages clés (quiz, sondage).",
      unitHint: "0-100 — ex. 58", defaultProvenance: "declared" },
    { kpiId: "event.inspiration_score", dimension: "appropriation", label: "Score d'inspiration",
      helper: "Dans quelle mesure l'événement a-t-il inspiré / motivé ?",
      unitHint: "0-100 — ex. 62", defaultProvenance: "declared" },
    // Impact
    { kpiId: "event.strategic_alignment_score", dimension: "impact", label: "Alignement stratégique perçu",
      helper: "Les participants se sentent-ils plus alignés sur la direction ?",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    { kpiId: "event.intent_to_act_score", dimension: "impact", label: "Intention d'agir",
      helper: "Proportion déclarant vouloir agir suite à l'événement.",
      unitHint: "0-100 — ex. 55", defaultProvenance: "declared" },
    { kpiId: "event.post_event_activation_rate", dimension: "impact", label: "Activation post-événement",
      helper: "Participants ayant posé une action concrète après l'événement.",
      unitHint: "% — ex. 30", defaultProvenance: "measured" },
  ],
  digital_campaign: [
    // Mobilisation
    { kpiId: "internal.audience_coverage_rate", dimension: "reach", label: "Taux de couverture",
      helper: "Personnes effectivement touchées / audience cible.",
      unitHint: "% — ex. 80", defaultProvenance: "measured" },
    { kpiId: "internal.delivery_rate", dimension: "reach", label: "Taux de délivrabilité",
      helper: "Messages délivrés / messages envoyés.",
      unitHint: "% — ex. 97", defaultProvenance: "measured" },
    { kpiId: "internal.open_rate", dimension: "reach", label: "Taux d'ouverture",
      helper: "Messages ouverts / messages délivrés.",
      unitHint: "% — ex. 40", defaultProvenance: "measured" },
    // Implication
    { kpiId: "internal.click_rate", dimension: "engagement", label: "Taux de clic",
      helper: "Clics générés / messages délivrés.",
      unitHint: "% — ex. 8", defaultProvenance: "measured" },
    { kpiId: "internal.content_consumption_rate", dimension: "engagement", label: "Consommation du contenu",
      helper: "Part des utilisateurs ayant consulté plus de la moitié du contenu.",
      unitHint: "% — ex. 55", defaultProvenance: "measured" },
    // Compréhension
    { kpiId: "internal.message_clarity_score", dimension: "appropriation", label: "Clarté perçue du message",
      helper: "Note moyenne de clarté ramenée sur 100.",
      unitHint: "0-100 — ex. 75", defaultProvenance: "declared" },
    { kpiId: "internal.memorization_score", dimension: "appropriation", label: "Mémorisation du message",
      helper: "Capacité à citer le message principal de la campagne.",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    { kpiId: "internal.usefulness_score", dimension: "appropriation", label: "Utilité perçue",
      helper: "Le message est-il perçu comme utile par l'audience ?",
      unitHint: "0-100 — ex. 65", defaultProvenance: "declared" },
    // Impact
    { kpiId: "internal.alignment_score", dimension: "impact", label: "Alignement avec l'objectif",
      helper: "Degré d'alignement perçu avec l'objectif de la campagne.",
      unitHint: "0-100 — ex. 65", defaultProvenance: "declared" },
    { kpiId: "internal.completion_rate", dimension: "impact", label: "Taux de complétion",
      helper: "Personnes ayant réalisé l'action attendue / population cible.",
      unitHint: "% — ex. 25", defaultProvenance: "measured" },
  ],
  change_management: [
    // Mobilisation
    { kpiId: "internal.audience_coverage_rate", dimension: "reach", label: "Couverture de l'audience",
      helper: "Part de la population cible effectivement informée.",
      unitHint: "% — ex. 85", defaultProvenance: "measured" },
    { kpiId: "internal.open_rate", dimension: "reach", label: "Taux d'ouverture",
      helper: "Messages lus / messages envoyés (briefs, communications officielles).",
      unitHint: "% — ex. 55", defaultProvenance: "measured" },
    // Implication
    { kpiId: "internal.participation_rate", dimension: "engagement", label: "Taux de participation",
      helper: "Personnes ayant pris part aux moments clés (ateliers, briefs…).",
      unitHint: "% — ex. 60", defaultProvenance: "measured" },
    { kpiId: "internal.click_rate", dimension: "engagement", label: "Interaction avec les supports",
      helper: "Clics / interactions sur les supports de communication dédiés.",
      unitHint: "% — ex. 22", defaultProvenance: "measured" },
    // Compréhension
    { kpiId: "internal.message_understanding_score", dimension: "appropriation", label: "Compréhension du changement",
      helper: "Les collaborateurs comprennent-ils ce qui change et pourquoi ?",
      unitHint: "0-100 — ex. 55", defaultProvenance: "declared" },
    { kpiId: "internal.message_clarity_score", dimension: "appropriation", label: "Clarté du discours",
      helper: "Clarté perçue du discours managérial sur le changement.",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    { kpiId: "internal.usefulness_score", dimension: "appropriation", label: "Utilité perçue",
      helper: "Le changement est-il perçu comme utile à leur activité ?",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    // Impact
    { kpiId: "internal.adoption_rate", dimension: "impact", label: "Taux d'adoption",
      helper: "Personnes ayant adopté le nouveau processus / outil.",
      unitHint: "% — ex. 40", defaultProvenance: "measured" },
    { kpiId: "internal.alignment_score", dimension: "impact", label: "Alignement sur la direction",
      helper: "Degré d'adhésion à la nouvelle direction.",
      unitHint: "0-100 — ex. 58", defaultProvenance: "declared" },
    { kpiId: "internal.completion_rate", dimension: "impact", label: "Complétion des actions attendues",
      helper: "Part des étapes du plan de change effectivement réalisées.",
      unitHint: "% — ex. 50", defaultProvenance: "measured" },
  ],
  newsletter: [
    // Mobilisation
    { kpiId: "internal.audience_coverage_rate", dimension: "reach", label: "Couverture de l'audience",
      helper: "Abonnés / population cible théorique.",
      unitHint: "% — ex. 90", defaultProvenance: "measured" },
    { kpiId: "internal.delivery_rate", dimension: "reach", label: "Taux de délivrabilité",
      helper: "Emails délivrés / emails envoyés.",
      unitHint: "% — ex. 98", defaultProvenance: "measured" },
    { kpiId: "internal.open_rate", dimension: "reach", label: "Taux d'ouverture",
      helper: "Emails ouverts / emails délivrés.",
      unitHint: "% — ex. 42", defaultProvenance: "measured" },
    // Implication
    { kpiId: "internal.click_to_open_rate", dimension: "engagement", label: "Taux de clic sur ouverture",
      helper: "Clics / ouvertures — qualité réelle du contenu.",
      unitHint: "% — ex. 18", defaultProvenance: "measured" },
    { kpiId: "internal.content_consumption_rate", dimension: "engagement", label: "Temps de lecture moyen",
      helper: "Part des lecteurs ayant consommé l'essentiel de la newsletter.",
      unitHint: "% — ex. 45", defaultProvenance: "estimated" },
    // Compréhension
    { kpiId: "internal.message_clarity_score", dimension: "appropriation", label: "Clarté du message",
      helper: "Note de clarté ramenée sur 100.",
      unitHint: "0-100 — ex. 70", defaultProvenance: "declared" },
    { kpiId: "internal.usefulness_score", dimension: "appropriation", label: "Utilité perçue",
      helper: "Valeur perçue du contenu par les lecteurs.",
      unitHint: "0-100 — ex. 65", defaultProvenance: "declared" },
    // Impact
    { kpiId: "internal.alignment_score", dimension: "impact", label: "Alignement avec la ligne éditoriale",
      helper: "Cohérence perçue avec les messages stratégiques.",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    { kpiId: "internal.completion_rate", dimension: "impact", label: "Action réalisée",
      helper: "Lecteurs ayant réalisé l'action attendue.",
      unitHint: "% — ex. 12", defaultProvenance: "measured" },
  ],
  product_launch: [
    // Mobilisation
    { kpiId: "internal.audience_coverage_rate", dimension: "reach", label: "Couverture du lancement",
      helper: "Audience cible effectivement touchée par l'annonce.",
      unitHint: "% — ex. 80", defaultProvenance: "measured" },
    { kpiId: "internal.open_rate", dimension: "reach", label: "Taux d'ouverture des annonces",
      helper: "Annonces ouvertes / annonces délivrées.",
      unitHint: "% — ex. 50", defaultProvenance: "measured" },
    // Implication
    { kpiId: "internal.participation_rate", dimension: "engagement", label: "Participation aux temps forts",
      helper: "Participation aux webinars, démos, Q&A.",
      unitHint: "% — ex. 50", defaultProvenance: "measured" },
    { kpiId: "internal.click_rate", dimension: "engagement", label: "Clics sur les supports produit",
      helper: "Clics vers la landing / démos / docs produit.",
      unitHint: "% — ex. 15", defaultProvenance: "measured" },
    // Compréhension
    { kpiId: "internal.memorization_score", dimension: "appropriation", label: "Mémorisation des bénéfices",
      helper: "Capacité à citer les bénéfices clés du produit.",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    { kpiId: "internal.message_clarity_score", dimension: "appropriation", label: "Clarté du positionnement",
      helper: "Le positionnement produit est-il clair pour la cible ?",
      unitHint: "0-100 — ex. 65", defaultProvenance: "declared" },
    { kpiId: "internal.usefulness_score", dimension: "appropriation", label: "Utilité perçue du produit",
      helper: "Le produit répond-il à un besoin réel ?",
      unitHint: "0-100 — ex. 70", defaultProvenance: "declared" },
    // Impact
    { kpiId: "internal.adoption_rate", dimension: "impact", label: "Taux d'adoption",
      helper: "Utilisateurs ayant réellement adopté le produit.",
      unitHint: "% — ex. 35", defaultProvenance: "measured" },
    { kpiId: "internal.alignment_score", dimension: "impact", label: "Alignement avec la stratégie",
      helper: "Cohérence perçue avec la vision / roadmap globale.",
      unitHint: "0-100 — ex. 65", defaultProvenance: "declared" },
  ],
  other: [
    // Mobilisation
    { kpiId: "internal.audience_coverage_rate", dimension: "reach", label: "Couverture de l'audience",
      helper: "Part de l'audience cible effectivement touchée.",
      unitHint: "% — ex. 70", defaultProvenance: "measured" },
    { kpiId: "internal.delivery_rate", dimension: "reach", label: "Taux de diffusion effective",
      helper: "Communications effectivement reçues / communications prévues.",
      unitHint: "% — ex. 95", defaultProvenance: "measured" },
    // Implication
    { kpiId: "internal.participation_rate", dimension: "engagement", label: "Taux de participation / interaction",
      helper: "Participants actifs / audience cible.",
      unitHint: "% — ex. 40", defaultProvenance: "measured" },
    // Compréhension
    { kpiId: "internal.message_clarity_score", dimension: "appropriation", label: "Clarté du message",
      helper: "Clarté perçue du message principal.",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    { kpiId: "internal.usefulness_score", dimension: "appropriation", label: "Utilité perçue",
      helper: "Valeur ressentie par l'audience.",
      unitHint: "0-100 — ex. 60", defaultProvenance: "declared" },
    // Impact
    { kpiId: "internal.alignment_score", dimension: "impact", label: "Alignement avec l'objectif",
      helper: "Degré d'alignement perçu avec l'objectif de l'action.",
      unitHint: "0-100 — ex. 55", defaultProvenance: "declared" },
    { kpiId: "internal.completion_rate", dimension: "impact", label: "Taux de complétion",
      helper: "Part des actions attendues effectivement réalisées.",
      unitHint: "% — ex. 45", defaultProvenance: "measured" },
  ],
};

/* Étiquettes humaines */
const INITIATIVE_OPTIONS: { id: InitiativeType; label: string }[] = [
  { id: "corporate_event",   label: "Événement interne" },
  { id: "digital_campaign",  label: "Campagne digitale" },
  { id: "change_management", label: "Plan de change management" },
  { id: "newsletter",        label: "Newsletter / email" },
  { id: "product_launch",    label: "Lancement produit / projet" },
  { id: "other",             label: "Autre" },
];

const AUDIENCE_OPTIONS = [
  "Tous collaborateurs", "Managers", "COMEX", "Équipe projet", "Public externe", "Mixte",
];

const INTENT_OPTIONS = [
  "Informer", "Mobiliser", "Engager", "Expliquer un changement", "Célébrer", "Aligner",
];

const PROVENANCE_OPTIONS: { id: Provenance; label: string; helper: string }[] = [
  { id: "measured",  label: "Mesurée",  helper: "Donnée issue d'un outil ou d'un système." },
  { id: "declared",  label: "Déclarée", helper: "Issue d'un sondage, d'un feedback." },
  { id: "estimated", label: "Estimée",  helper: "Jugement expert, approximation raisonnée." },
  { id: "proxy",     label: "Indirecte", helper: "Indicateur de substitution (proxy)." },
];

const CONFIDENCE_MAP: Record<ConfidenceLabel, number> = {
  high: 0.9, medium: 0.65, low: 0.35,
};

const DIMENSION_META: Record<Dimension, { label: string; color: string; helper: string }> = {
  reach:         { label: "Mobilisation",  color: "#60a5fa", helper: "Qui a été touché ?" },
  engagement:    { label: "Implication",   color: "#34d399", helper: "Comment ils ont interagi ?" },
  appropriation: { label: "Appropriation", color: "#fbbf24", helper: "Qu'ont-ils retenu / compris ?" },
  impact:        { label: "Impact",         color: "#f472b6", helper: "Quel effet concret ?" },
};

/* ═══════════════════════════════════════════════════════════════════
   PERSISTANCE LOCALE
   ═══════════════════════════════════════════════════════════════════ */

const LS_KEY = "momentum_wizard_v1";
const saveLocal = (s: WizardState) => { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {} };
const clearLocal = () => { try { localStorage.removeItem(LS_KEY); } catch {} };
const loadLocal = (): WizardState | null => {
  try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};

/* ═══════════════════════════════════════════════════════════════════
   REDUCER
   ═══════════════════════════════════════════════════════════════════ */

const INITIAL_STATE: WizardState = {
  step: 0,
  id: { name: "", initiativeType: "", audienceType: "", audienceSize: 0, intent: "" },
  answers: {},
  submitting: false,
  apiError: null,
  diagnostic: null,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "HYDRATE":       return action.state;
    case "INTRO_NEXT":    return { ...state, step: 1 };
    case "SET_ID":        return { ...state, id: { ...state.id, ...action.patch } };
    case "NEXT":          return { ...state, step: state.step + 1 };
    case "PREV":          return { ...state, step: Math.max(0, state.step - 1) };
    case "GOTO":          return { ...state, step: action.step };
    case "SAVE_ANSWER":
      return { ...state, answers: { ...state.answers, [action.answer.kpiId]: action.answer } };
    case "REMOVE_ANSWER": {
      const next = { ...state.answers }; delete next[action.kpiId];
      return { ...state, answers: next };
    }
    case "SUBMIT_START":   return { ...state, submitting: true, apiError: null };
    case "SUBMIT_SUCCESS": return { ...state, submitting: false, diagnostic: action.diagnostic, step: -2 };
    case "SUBMIT_ERROR":   return { ...state, submitting: false, apiError: action.error, diagnostic: action.fallback, step: -2 };
    case "RESET":          clearLocal(); return INITIAL_STATE;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FALLBACK (quand l'API n'est pas joignable)
   ═══════════════════════════════════════════════════════════════════ */

const FALLBACK_DIAGNOSTIC: DiagnosticPayload = {
  score: {
    overall_score: 0,
    confidence_score: 0,
    dimension_scores: [],
    measured_count: 0,
    estimated_count: 0,
    declared_count: 0,
    proxy_count: 0,
    missing_dimensions: ["reach", "engagement", "appropriation", "impact"],
  },
  interpretation: {
    executive_summary: {
      headline: "Diagnostic généré localement",
      key_insight:
        "L'API Momentum n'est pas joignable — voici une lecture locale basée sur vos saisies. La confiance reste limitée tant que le backend n'est pas connecté.",
      top_strengths: [
        "Structure de mesure en place",
        "Diversité des dimensions couvertes",
        "Provenance des données documentée",
      ],
      top_priorities: [
        "Connecter le backend /kpis/score-and-interpret",
        "Compléter les dimensions manquantes",
        "Renforcer la collecte de données mesurées",
      ],
    },
    detailed_analysis: {
      summary:
        "Synthèse provisoire. Le moteur de scoring complet nécessite l'API FastAPI en ligne.",
      strengths: [
        { title: "Saisie structurée", description: "Les signaux sont correctement typés avec provenance." },
      ],
      weaknesses: [
        { title: "Scoring non disponible", description: "Le backend n'a pas répondu — pas de performance_score calculé." },
      ],
      recommendations: [
        { title: "Lancer l'API", action: "Démarrer uvicorn main:app --reload sur le port 8000.", priority: "haute" },
      ],
      data_gaps: [
        { field: "api", issue: "Backend non joignable", impact: "Pas de scoring pondéré ni d'interprétation." },
      ],
    },
  },
};

/* ═══════════════════════════════════════════════════════════════════
   COMPOSANT RACINE
   ═══════════════════════════════════════════════════════════════════ */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Wrapper Suspense requis par Next.js 14 pour useSearchParams() — sans ça,
// la page ne peut pas être pré-rendue côté serveur (échec du build Vercel).
export default function DiagnosticPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#94a3b8" }}>Chargement du diagnostic…</div>}>
      <DiagnosticWizardPage />
    </Suspense>
  );
}

function DiagnosticWizardPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const searchParams = useSearchParams();

  /* Hydratation : URL params (depuis Campaign Studio) uniquement.
     On ne restaure PAS automatiquement l'état précédent depuis localStorage —
     chaque visite /diagnostic repart d'une feuille blanche (intro), ce qui
     correspond à l'attente utilisateur ("nouveau diagnostic" = vraiment nouveau).
     Les params URL acceptés : from_campaign, name, type, audience, audience_size, intent. */
  useEffect(() => {
    const fromCampaign = searchParams.get("from_campaign");
    if (fromCampaign) {
      const types: InitiativeType[] = [
        "corporate_event", "digital_campaign", "change_management",
        "newsletter", "product_launch", "other",
      ];
      const rawType = searchParams.get("type") ?? "";
      const initiativeType = (types as readonly string[]).includes(rawType)
        ? (rawType as InitiativeType)
        : "";
      const sizeStr = searchParams.get("audience_size") ?? "";
      const audienceSize = sizeStr && !isNaN(Number(sizeStr)) ? Number(sizeStr) : 0;

      dispatch({
        type: "HYDRATE",
        state: {
          ...INITIAL_STATE,
          step: 1, // démarre direct sur l'étape Identification
          id: {
            name: searchParams.get("name") ?? "",
            initiativeType,
            audienceType: searchParams.get("audience") ?? "",
            audienceSize,
            intent: searchParams.get("intent") ?? "",
          },
        },
      });
      return;
    }
    // Pas d'URL param : on part toujours d'un état vierge, et on purge tout
    // reliquat éventuel d'une session précédente (évite les réponses fantômes).
    clearLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sauvegarde auto (debounce léger) */
  useEffect(() => {
    const t = setTimeout(() => saveLocal(state), 400);
    return () => clearTimeout(t);
  }, [state]);

  /* KPIs à poser en fonction du type choisi */
  const kpiQuestions = useMemo<KPIQuestion[]>(() => {
    if (!state.id.initiativeType) return [];
    return KPI_PLAN[state.id.initiativeType as InitiativeType] ?? [];
  }, [state.id.initiativeType]);

  /* Nombre total de slides (identification = 5, puis une par KPI + 1 review) */
  const totalSteps = 5 + kpiQuestions.length + 1;

  /* Index KPI courant (si on est dans la phase KPI) */
  const kpiIndex = state.step > 5 && state.step <= 5 + kpiQuestions.length ? state.step - 6 : -1;
  const currentKPI = kpiIndex >= 0 ? kpiQuestions[kpiIndex] : null;

  /* Progression (0 → 1) */
  const progress = Math.min(1, Math.max(0, state.step > 0 ? state.step / totalSteps : 0));

  /* Soumission finale */
  async function submit() {
    dispatch({ type: "SUBMIT_START" });

    const signals = Object.values(state.answers).map(a => ({
      kpi_id: a.kpiId,
      dimension: kpiQuestions.find(k => k.kpiId === a.kpiId)?.dimension ?? "impact",
      value: Math.max(0, Math.min(100, a.value)),
      provenance: a.provenance,
      confidence: CONFIDENCE_MAP[a.confidenceLabel],
      method: a.note ?? undefined,
    }));

    // Contexte envoyé au backend pour que le LLM (Anthropic) puisse
    // personnaliser les recommandations (nom, type, audience, intention).
    const context = {
      name: state.id.name || undefined,
      initiative_type: state.id.initiativeType || undefined,
      audience: state.id.audienceType || undefined,
      audience_size: state.id.audienceSize || undefined,
      intent: state.id.intent || undefined,
    };

    try {
      // Par défaut, on appelle la route Next.js embarquée (/api/kpis/...).
      // Si NEXT_PUBLIC_API_BASE_URL est défini, on tape le backend FastAPI (/kpis/...).
      const endpoint = API_BASE_URL
        ? `${API_BASE_URL}/kpis/score-and-interpret`
        : `/api/kpis/score-and-interpret`;
      // Vers la route Next.js : envoi enrichi { signals, context }.
      // Vers le backend Python : on reste sur le contrat historique (array seul).
      const body = API_BASE_URL ? signals : { signals, context };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const raw = await res.json();
      // L'endpoint renvoie { score, interpretation } — exactement notre DiagnosticPayload.
      const diagnostic: DiagnosticPayload = {
        score: raw.score,
        interpretation: raw.interpretation,
      };
      dispatch({ type: "SUBMIT_SUCCESS", diagnostic });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      dispatch({ type: "SUBMIT_ERROR", error: msg, fallback: FALLBACK_DIAGNOSTIC });
    }
  }

  return (
    <div className="root">
      <style jsx global>{`
        html, body, #__next { background: #0a0d1a; color: #e2e8f0; }

        /* ─────────────────────────────────────────────────────────
           Styles d'impression — l'utilisateur obtient un PDF propre
           en choisissant "Enregistrer au format PDF" dans la boîte
           de dialogue du navigateur. On masque la chrome du wizard
           et on force un thème clair imprimable.
           ───────────────────────────────────────────────────────── */
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body, #__next {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          /* On masque tout sauf le dashboard */
          .root > * { display: none !important; }
          .root .shell { display: block !important; max-width: 100% !important; }
          .shell > :not(.dashboard-print-root) { display: none !important; }
          .dashboard-print-root { display: block !important; animation: none !important; }

          /* Blocs : fond blanc, bordures légères, pas d'ombres */
          .dashboard-print-root > div,
          .dashboard-print-root section {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          .dashboard-print-root * {
            color: #0f172a !important;
          }
          /* Masquer la barre d'actions et le toast */
          .no-print { display: none !important; }

          /* Les jauges/radars SVG gardent leurs couleurs de remplissage */
          .dashboard-print-root svg * { color: initial; }
        }
      `}</style>
      <style jsx>{`
        .root {
          min-height: 100vh;
          background: radial-gradient(ellipse at top, rgba(77,95,255,0.08), transparent 50%), #0a0d1a;
          color: #e2e8f0;
          font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
          padding: 24px;
          padding-bottom: 80px;
        }
        .shell { max-width: 760px; margin: 0 auto; transition: max-width 0.3s; }
        .shell.wide { max-width: 1160px; }
        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .brand-logo {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #4d5fff, #7c3aed);
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .brand-name { font-weight: 800; font-size: 15px; }
        .brand-sub  { font-size: 10px; color: #475569; }
        .progress-track {
          height: 3px; background: rgba(255,255,255,0.06); border-radius: 9px; overflow: hidden;
          margin-bottom: 36px;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4d5fff, #7c3aed);
          transition: width 0.45s cubic-bezier(0.16,1,0.3,1);
        }
      `}</style>

      <div className={`shell ${state.step === -2 ? "wide" : ""}`}>
        {/* Top bar */}
        <div className="topbar">
          <div className="brand">
            <div className="brand-logo">⚡</div>
            <div>
              <div className="brand-name">Momentum</div>
              <div className="brand-sub">Diagnostic de performance</div>
            </div>
          </div>
          <StepIndicator step={state.step} total={totalSteps} />
        </div>

        {/* Progress */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Content */}
        {state.step === 0 && <IntroSlide onStart={() => dispatch({ type: "INTRO_NEXT" })} />}

        {state.step === 1 && (
          <NameSlide
            value={state.id.name}
            onChange={(v) => dispatch({ type: "SET_ID", patch: { name: v } })}
            onNext={() => dispatch({ type: "NEXT" })}
            onPrev={() => dispatch({ type: "PREV" })}
          />
        )}

        {state.step === 2 && (
          <ChoiceSlide
            question="Quel type d'action est-ce ?"
            helper="On adapte les KPIs à poser en fonction."
            options={INITIATIVE_OPTIONS.map(o => ({ value: o.id, label: o.label }))}
            value={state.id.initiativeType}
            onChange={(v) => dispatch({ type: "SET_ID", patch: { initiativeType: v as InitiativeType } })}
            onNext={() => dispatch({ type: "NEXT" })}
            onPrev={() => dispatch({ type: "PREV" })}
          />
        )}

        {state.step === 3 && (
          <ChoiceSlide
            question="Quelle était l'audience cible ?"
            helper="Qui deviez-vous toucher ?"
            options={AUDIENCE_OPTIONS.map(o => ({ value: o, label: o }))}
            value={state.id.audienceType}
            onChange={(v) => dispatch({ type: "SET_ID", patch: { audienceType: v } })}
            onNext={() => dispatch({ type: "NEXT" })}
            onPrev={() => dispatch({ type: "PREV" })}
          />
        )}

        {state.step === 4 && (
          <NumberSlide
            question="Quelle était la taille de l'audience visée ?"
            helper="Nombre de personnes (approximatif si besoin)."
            value={state.id.audienceSize}
            suffix="personnes"
            onChange={(v) => dispatch({ type: "SET_ID", patch: { audienceSize: v } })}
            onNext={() => dispatch({ type: "NEXT" })}
            onPrev={() => dispatch({ type: "PREV" })}
          />
        )}

        {state.step === 5 && (
          <ChoiceSlide
            question="Quelle était l'intention principale ?"
            helper="Ce que vous vouliez provoquer."
            options={INTENT_OPTIONS.map(o => ({ value: o, label: o }))}
            value={state.id.intent}
            onChange={(v) => dispatch({ type: "SET_ID", patch: { intent: v } })}
            onNext={() => dispatch({ type: "NEXT" })}
            onPrev={() => dispatch({ type: "PREV" })}
          />
        )}

        {currentKPI && (
          <KPISlide
            kpi={currentKPI}
            index={kpiIndex + 1}
            total={kpiQuestions.length}
            answer={state.answers[currentKPI.kpiId]}
            onSave={(a) => dispatch({ type: "SAVE_ANSWER", answer: a })}
            onRemove={() => dispatch({ type: "REMOVE_ANSWER", kpiId: currentKPI.kpiId })}
            onNext={() => dispatch({ type: "NEXT" })}
            onPrev={() => dispatch({ type: "PREV" })}
          />
        )}

        {state.step === totalSteps && (
          <ReviewSlide
            id={state.id}
            answers={state.answers}
            kpis={kpiQuestions}
            submitting={state.submitting}
            onSubmit={submit}
            onPrev={() => dispatch({ type: "PREV" })}
            onJumpTo={(i) => dispatch({ type: "GOTO", step: i })}
          />
        )}

        {state.step === -2 && state.diagnostic && (
          <ResultDashboard
            diagnostic={state.diagnostic}
            apiError={state.apiError}
            id={state.id}
            answers={state.answers}
            kpis={kpiQuestions}
            onReset={() => dispatch({ type: "RESET" })}
            onEditData={() => dispatch({ type: "GOTO", step: -1 })}
            fromCampaignId={searchParams.get("from_campaign") ?? undefined}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS DE SAISIE
   ═══════════════════════════════════════════════════════════════════ */

function StepIndicator({ step, total }: { step: number; total: number }) {
  if (step <= 0 || step > total) return null;
  return (
    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
      Étape {step} / {total}
    </div>
  );
}

/* ── Intro ──────────────────────────────────────────────────────── */
function IntroSlide({ onStart }: { onStart: () => void }) {
  return (
    <Slide>
      <Tag>Momentum AI</Tag>
      <H1>Diagnostiquons la performance de votre action.</H1>
      <P>
        Je vais vous poser quelques questions pour comprendre votre contexte, puis collecter les
        bons KPIs sans jargon. Chaque réponse précise aussi la <b>fiabilité</b> de la donnée — nous
        n'inventons jamais un chiffre que vous n'avez pas mesuré.
      </P>
      <P style={{ color: "#64748b", fontSize: 13 }}>
        Comptez 3 à 5 minutes. Vos réponses sont sauvegardées localement à chaque étape.
      </P>
      <Actions>
        <Btn primary onClick={onStart}>Commencer le diagnostic</Btn>
      </Actions>
    </Slide>
  );
}

/* ── Nom ────────────────────────────────────────────────────────── */
function NameSlide(props: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onPrev: () => void;
}) {
  const canNext = props.value.trim().length > 1;
  return (
    <Slide>
      <Question n={1}>Quel est le nom de cette action de communication ?</Question>
      <Helper>Pour la retrouver ensuite dans votre tableau de bord.</Helper>
      <Input
        value={props.value}
        onChange={props.onChange}
        placeholder="Ex: Séminaire Management Q3, Kick-off Horizon, Newsletter RSE…"
        onEnter={() => canNext && props.onNext()}
        autoFocus
      />
      <Actions>
        <Btn ghost onClick={props.onPrev}>Retour</Btn>
        <Btn primary disabled={!canNext} onClick={props.onNext}>Continuer →</Btn>
      </Actions>
    </Slide>
  );
}

/* ── Choix multiple ─────────────────────────────────────────────── */
function ChoiceSlide(props: {
  question: string; helper: string;
  options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void;
  onNext: () => void; onPrev: () => void;
}) {
  const canNext = props.value !== "";
  return (
    <Slide>
      <Question>{props.question}</Question>
      <Helper>{props.helper}</Helper>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginTop: 20 }}>
        {props.options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => { props.onChange(o.value); setTimeout(props.onNext, 180); }}
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: props.value === o.value ? "rgba(77,95,255,0.18)" : "rgba(255,255,255,0.03)",
              border: props.value === o.value ? "1.5px solid rgba(77,95,255,0.5)" : "1.5px solid rgba(255,255,255,0.06)",
              color: "#e2e8f0",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Actions>
        <Btn ghost onClick={props.onPrev}>Retour</Btn>
        <Btn primary disabled={!canNext} onClick={props.onNext}>Continuer →</Btn>
      </Actions>
    </Slide>
  );
}

/* ── Nombre ─────────────────────────────────────────────────────── */
function NumberSlide(props: {
  question: string; helper: string;
  value: number; suffix: string;
  onChange: (v: number) => void;
  onNext: () => void; onPrev: () => void;
}) {
  const canNext = props.value > 0;
  return (
    <Slide>
      <Question>{props.question}</Question>
      <Helper>{props.helper}</Helper>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <Input
          type="number"
          value={props.value ? String(props.value) : ""}
          onChange={v => props.onChange(Number(v) || 0)}
          placeholder="Ex: 320"
          onEnter={() => canNext && props.onNext()}
          autoFocus
        />
        <span style={{ color: "#64748b", fontSize: 14 }}>{props.suffix}</span>
      </div>
      <Actions>
        <Btn ghost onClick={props.onPrev}>Retour</Btn>
        <Btn primary disabled={!canNext} onClick={props.onNext}>Continuer →</Btn>
      </Actions>
    </Slide>
  );
}

/* ── KPI (cœur conversationnel) ─────────────────────────────────── */
function KPISlide(props: {
  kpi: KPIQuestion; index: number; total: number;
  answer: KPIAnswer | undefined;
  onSave: (a: KPIAnswer) => void;
  onRemove: () => void;
  onNext: () => void; onPrev: () => void;
}) {
  const [value, setValue] = useState<string>(props.answer?.value?.toString() ?? "");
  const [provenance, setProvenance] = useState<Provenance>(
    props.answer?.provenance ?? props.kpi.defaultProvenance
  );
  const [confidence, setConfidence] = useState<ConfidenceLabel>(
    props.answer?.confidenceLabel ?? "medium"
  );
  const dim = DIMENSION_META[props.kpi.dimension];

  /* Re-synchroniser si on change de KPI */
  useEffect(() => {
    setValue(props.answer?.value?.toString() ?? "");
    setProvenance(props.answer?.provenance ?? props.kpi.defaultProvenance);
    setConfidence(props.answer?.confidenceLabel ?? "medium");
  }, [props.kpi.kpiId, props.answer, props.kpi.defaultProvenance]);

  const numericValue = Number(value);
  const hasValue = value.trim() !== "" && !Number.isNaN(numericValue);

  function saveAndNext() {
    if (hasValue) {
      props.onSave({
        kpiId: props.kpi.kpiId,
        value: Math.max(0, Math.min(100, numericValue)),
        provenance, confidenceLabel: confidence,
      });
    }
    props.onNext();
  }

  function skip() {
    props.onRemove();
    props.onNext();
  }

  return (
    <Slide>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
          background: dim.color + "22", color: dim.color, textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          {dim.label}
        </span>
        <span style={{ fontSize: 11, color: "#475569" }}>
          KPI {props.index} / {props.total} · <code style={{ fontSize: 10 }}>{props.kpi.kpiId}</code>
        </span>
      </div>
      <Question>{props.kpi.label}</Question>
      <Helper>{props.kpi.helper}</Helper>

      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <Input
          type="number"
          value={value}
          onChange={setValue}
          placeholder={props.kpi.unitHint}
          onEnter={saveAndNext}
          autoFocus
        />
      </div>

      {hasValue && (
        <>
          <SubLabel>Type de donnée</SubLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
            {PROVENANCE_OPTIONS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvenance(p.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: provenance === p.id ? "rgba(77,95,255,0.18)" : "rgba(255,255,255,0.03)",
                  border: provenance === p.id ? "1.5px solid rgba(77,95,255,0.5)" : "1.5px solid rgba(255,255,255,0.06)",
                  color: "#e2e8f0",
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.helper}</div>
              </button>
            ))}
          </div>

          <SubLabel>Niveau de confiance</SubLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {(["high", "medium", "low"] as ConfidenceLabel[]).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setConfidence(c)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: confidence === c ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)",
                  border: confidence === c ? "1.5px solid rgba(16,185,129,0.4)" : "1.5px solid rgba(255,255,255,0.06)",
                  color: "#e2e8f0", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {c === "high" ? "Élevé" : c === "medium" ? "Moyen" : "Faible"}
              </button>
            ))}
          </div>
        </>
      )}

      <Actions>
        <Btn ghost onClick={props.onPrev}>Retour</Btn>
        <Btn ghost onClick={skip}>Passer (je n'ai pas la donnée)</Btn>
        <Btn primary disabled={!hasValue} onClick={saveAndNext}>
          {hasValue ? "Enregistrer & continuer →" : "Renseigner une valeur"}
        </Btn>
      </Actions>
    </Slide>
  );
}

/* ── Revue avant envoi ──────────────────────────────────────────── */
function ReviewSlide(props: {
  id: IdentificationData;
  answers: Record<string, KPIAnswer>;
  kpis: KPIQuestion[];
  submitting: boolean;
  onSubmit: () => void;
  onPrev: () => void;
  onJumpTo: (step: number) => void;
}) {
  const answered = props.kpis.filter(k => props.answers[k.kpiId]);
  const missing  = props.kpis.filter(k => !props.answers[k.kpiId]);
  const coverage = Math.round((answered.length / Math.max(props.kpis.length, 1)) * 100);

  return (
    <Slide>
      <Tag>Synthèse</Tag>
      <H2>Avant de lancer l'analyse</H2>
      <P>Vérifiez les informations, puis lancez le diagnostic.</P>

      {/* Identification */}
      <Card>
        <CardTitle>Votre action</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
          <KV label="Nom"        value={props.id.name}/>
          <KV label="Type"        value={INITIATIVE_OPTIONS.find(o => o.id === props.id.initiativeType)?.label ?? "—"}/>
          <KV label="Audience"    value={props.id.audienceType}/>
          <KV label="Taille"      value={props.id.audienceSize.toLocaleString("fr-FR")}/>
          <KV label="Intention"   value={props.id.intent}/>
        </div>
      </Card>

      {/* Couverture KPI */}
      <Card>
        <CardTitle>
          Couverture KPI
          <span style={{ marginLeft: 10, fontSize: 12, color: coverage >= 70 ? "#34d399" : coverage >= 40 ? "#fbbf24" : "#f87171", fontWeight: 700 }}>
            {answered.length}/{props.kpis.length} · {coverage}%
          </span>
        </CardTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {props.kpis.map((k, i) => {
            const a = props.answers[k.kpiId];
            const dim = DIMENSION_META[k.dimension];
            return (
              <div key={k.kpiId} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 10, background: a ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.04)",
                border: `1px solid ${a ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)"}`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: dim.color + "22", color: dim.color }}>
                  {dim.label}
                </span>
                <span style={{ fontSize: 13, color: "#cbd5e1", flex: 1 }}>{k.label}</span>
                {a ? (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>{a.value}</span>
                    <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>{a.provenance}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: "#f87171" }}>non renseigné</span>
                )}
                <button
                  onClick={() => props.onJumpTo(6 + i)}
                  style={{ border: "none", background: "rgba(255,255,255,0.06)", color: "#94a3b8",
                    fontSize: 11, padding: "3px 9px", borderRadius: 6, cursor: "pointer" }}
                >
                  {a ? "Modifier" : "Compléter"}
                </button>
              </div>
            );
          })}
        </div>
        {missing.length > 0 && (
          <P style={{ fontSize: 12, color: "#64748b", marginTop: 14 }}>
            {missing.length} KPI(s) non renseigné(s). Le moteur les remontera comme <b>data_gaps</b>
            — il ne les inventera pas. Vous pouvez compléter plus tard.
          </P>
        )}
      </Card>

      <Actions>
        <Btn ghost onClick={props.onPrev}>Retour</Btn>
        <Btn primary disabled={answered.length === 0 || props.submitting} onClick={props.onSubmit}>
          {props.submitting ? "Analyse en cours…" : "Générer le diagnostic →"}
        </Btn>
      </Actions>
    </Slide>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   PRIMITIVES DE MISE EN PAGE
   ═══════════════════════════════════════════════════════════════════ */

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ animation: "fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both" }}>
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {children}
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
      textTransform: "uppercase", color: "#818cf8", marginBottom: 10,
    }}>{children}</div>
  );
}

function H1({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <h1 style={{ fontSize: 36, lineHeight: 1.15, fontWeight: 800, color: "#f8fafc", margin: "0 0 14px", ...style }}>{children}</h1>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", margin: "0 0 10px" }}>{children}</h2>;
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.65, margin: "0 0 12px", ...style }}>{children}</p>;
}

function Question({ children, n }: { children: React.ReactNode; n?: number }) {
  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      {n && <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 4 }}>Question {n}</div>}
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.25, margin: 0 }}>{children}</h2>
    </div>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>{children}</p>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "#475569", margin: "24px 0 10px",
    }}>{children}</div>
  );
}

function Input(props: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <input
      type={props.type ?? "text"}
      value={props.value}
      autoFocus={props.autoFocus}
      onChange={(e) => props.onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && props.onEnter) props.onEnter(); }}
      placeholder={props.placeholder}
      style={{
        width: "100%", padding: "13px 16px", fontSize: 15,
        background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.08)",
        borderRadius: 12, color: "#f1f5f9", outline: "none", marginTop: 18,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(77,95,255,0.5)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(77,95,255,0.12)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 30, flexWrap: "wrap", alignItems: "center" }}>
      {children}
    </div>
  );
}

function Btn(props: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean; ghost?: boolean; disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 12,
    cursor: props.disabled ? "not-allowed" : "pointer",
    opacity: props.disabled ? 0.4 : 1,
    border: "none",
    transition: "all 0.15s",
  };
  if (props.primary) Object.assign(base, {
    background: "linear-gradient(135deg, #4d5fff, #7c3aed)",
    color: "#fff", boxShadow: "0 4px 14px rgba(77,95,255,0.25)",
  });
  if (props.ghost) Object.assign(base, {
    background: "rgba(255,255,255,0.05)",
    color: "#94a3b8",
  });
  return <button type="button" onClick={props.onClick} disabled={props.disabled} style={base}>{props.children}</button>;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: 20, borderRadius: 16, marginTop: 14,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    }}>{children}</div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 14, display: "flex", alignItems: "center" }}>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 500, marginTop: 3 }}>{value || "—"}</div>
    </div>
  );
}
