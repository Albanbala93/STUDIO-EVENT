/**
 * Bloc 7 — moteur de recommandation "prochaine étape".
 *
 * Pure function : prend un projet (et un contexte d'appel) → retourne une
 * liste ordonnée de NextStep. Aucun appel LLM, aucune dépendance externe,
 * 100% dérivé des vraies données disponibles.
 *
 * Principes :
 *   - jamais agressif : max 2 recommandations affichées simultanément ;
 *   - basé sur l'état réel du projet (pas de promesse vide) ;
 *   - chaque étape connaît la valeur qu'elle apporte (champ `valueProp`)
 *     pour donner à l'utilisateur le "pourquoi" ;
 *   - les URL réutilisent l'enrichissement Bloc 4 (ex. ?from_campaign=)
 *     pour pré-remplir le module suivant et donner une sensation fluide.
 */

import type { StudioProject } from "../studio/types";
import { buildEnrichedModuleInput, type ModuleName } from "./enrichment-engine";

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

export type NextStepKind =
  | "measure_pilot"        // lancer Pilot pour ce dispositif
  | "remeasure_pilot"      // relancer une mesure (diagnostic ancien / stale)
  | "back_to_campaign"     // retour au dispositif Campaign d'origine
  | "share_diagnostic"     // partager le diagnostic
  | "complete_brief";      // compléter une section du dossier

export type NextStep = {
  id: NextStepKind;
  title: string;            // "Mesurer la performance avec Pilot"
  description: string;      // 1 phrase, contextualisée
  valueProp: string;        // pourquoi c'est utile maintenant (1 phrase)
  href: string;             // URL pré-remplie
  ctaLabel: string;         // libellé du bouton
  /** Source modulaire dont l'étape capitalise. */
  basedOn?: ModuleName;
  /** Modulé cible. */
  toModule: ModuleName;
  priority: number;         // ordre de tri descendant (le plus prioritaire en haut)
};

export type NextStepContext = "studio_project" | "pilot_result";

/* ──────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pilotOutput(project: StudioProject): any | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (project as any).modules?.pilot?.output ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pilotMeta(project: StudioProject): any | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (project as any).modules?.pilot ?? null;
}

function isStale(project: StudioProject, module: ModuleName): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(project as any).modules?.[module]?.staleness;
}

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function pluralize(n: number, singular: string, plural?: string): string {
  return n > 1 ? (plural ?? `${singular}s`) : singular;
}

/* ──────────────────────────────────────────────────────────────────
   Recettes — chaque scénario produit éventuellement un NextStep
   ────────────────────────────────────────────────────────────────── */

/** Scénario 1 — Campaign généré, Pilot jamais fait. */
function suggestMeasurePilot(project: StudioProject): NextStep | null {
  if (!project.output?.executiveSummary) return null;
  if (pilotOutput(project)) return null; // Pilot déjà fait → autre scénario

  const enriched = buildEnrichedModuleInput(project, "pilot");
  const usefulCount = enriched.selectedEnrichments.length;

  const detail = usefulCount > 0
    ? `${usefulCount} ${pluralize(usefulCount, "élément")} déjà ${pluralize(
        usefulCount,
        "préparé",
      )} (KPIs suggérés, audiences, messages clés) seront pré-remplis pour gagner du temps.`
    : "Le diagnostic prendra moins de 10 minutes et capitalisera sur le brief de ce projet.";

  return {
    id: "measure_pilot",
    title: "Mesurer la performance de ce dispositif",
    description:
      "Lancez un diagnostic Pilot pour évaluer la performance attendue et identifier les angles morts.",
    valueProp: detail,
    href: `/momentum/diagnostic?from_campaign=${encodeURIComponent(project.id)}`,
    ctaLabel: "Lancer Pilot",
    basedOn: "campaign",
    toModule: "pilot",
    priority: 90,
  };
}

/** Scénario 2 — Campaign + Pilot existant mais marqué stale ou ancien (>30j). */
function suggestRemeasurePilot(project: StudioProject): NextStep | null {
  const pilot = pilotOutput(project);
  if (!pilot) return null;

  const meta = pilotMeta(project);
  const lastMeasured = meta?.updatedAt;
  const days = daysSince(lastMeasured);
  const stale = isStale(project, "pilot");

  // On ne suggère la re-mesure que si Pilot est marqué stale OU > 60 jours.
  if (!stale && (days === null || days < 60)) return null;

  const detail = stale
    ? "Le projet a été modifié depuis le dernier diagnostic — relancer la mesure pour refléter l'état actuel."
    : `Dernière mesure il y a ${days} jours — un point régulier permet d'objectiver la trajectoire.`;

  return {
    id: "remeasure_pilot",
    title: "Mettre à jour le diagnostic Pilot",
    description:
      "Relancez une mesure pour reprendre la trajectoire de performance avec des chiffres frais.",
    valueProp: detail,
    href: `/momentum/diagnostic?from_campaign=${encodeURIComponent(project.id)}`,
    ctaLabel: "Lancer une nouvelle mesure",
    basedOn: "campaign",
    toModule: "pilot",
    priority: stale ? 95 : 70,
  };
}

/** Scénario 3 — Sur la page résultat Pilot, retour au dispositif Campaign. */
function suggestBackToCampaign(
  project: StudioProject | null,
  fromCampaignId: string | undefined,
): NextStep | null {
  if (!fromCampaignId) return null;
  // Si on a chargé le projet, on peut rendre le titre + le contexte ;
  // sinon on reste générique mais on garde le lien.
  const projectName = project?.title?.trim() || "le dispositif d'origine";
  return {
    id: "back_to_campaign",
    title: `Revenir au dispositif Campaign`,
    description: `Consulter ${projectName} et confronter la mesure aux livrables stratégiques.`,
    valueProp:
      "Le dossier Campaign reste la source de vérité — y revenir garantit la cohérence du déploiement.",
    href: `/studio/${encodeURIComponent(fromCampaignId)}`,
    ctaLabel: "Ouvrir le dispositif",
    basedOn: "pilot",
    toModule: "campaign",
    priority: 80,
  };
}

/** Scénario 4 — Sur la page résultat Pilot, partager le diagnostic. */
function suggestShareDiagnostic(
  projectId: string | undefined,
): NextStep | null {
  if (!projectId) return null;
  return {
    id: "share_diagnostic",
    title: "Partager ce diagnostic",
    description:
      "Diffuser la restitution exécutive aux parties prenantes (direction, équipe projet).",
    valueProp:
      "Un diagnostic partagé en lecture évite les allers-retours et accélère la décision.",
    href: `/momentum/projects/${encodeURIComponent(projectId)}`,
    ctaLabel: "Voir / partager",
    basedOn: "pilot",
    toModule: "pilot",
    priority: 60,
  };
}

/* ──────────────────────────────────────────────────────────────────
   API publique
   ────────────────────────────────────────────────────────────────── */

/**
 * Calcule jusqu'à `max` recommandations triées par priorité, pour le
 * contexte d'appel donné.
 *
 * - context = "studio_project" : appelé depuis app/studio/[id]/page.tsx
 * - context = "pilot_result"   : appelé depuis le ResultDashboard Pilot
 */
export function getNextSteps(
  project: StudioProject | null,
  context: NextStepContext,
  options?: {
    max?: number;
    fromCampaignId?: string;
    pilotProjectId?: string;
  },
): NextStep[] {
  const max = options?.max ?? 2;
  const candidates: NextStep[] = [];

  if (context === "studio_project" && project) {
    const a = suggestMeasurePilot(project);
    if (a) candidates.push(a);
    const b = suggestRemeasurePilot(project);
    if (b) candidates.push(b);
  }

  if (context === "pilot_result") {
    const c = suggestBackToCampaign(project, options?.fromCampaignId);
    if (c) candidates.push(c);
    const d = suggestShareDiagnostic(options?.pilotProjectId);
    if (d) candidates.push(d);
  }

  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max);
}
