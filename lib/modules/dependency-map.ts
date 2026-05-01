/**
 * Bloc 6 — mapping de dépendances entre champs projet et modules consommateurs.
 *
 * Source unique de vérité : "quand tel champ change, quels modules sont
 * potentiellement affectés ?". Utilisé par staleness.ts pour décider quels
 * modules marquer comme à rafraîchir.
 *
 * Convention :
 *   - clé "brief.<field>"   → un champ du brief Campaign
 *   - clé "module.<name>"   → la sortie complète d'un module
 *
 * Cohérent avec la logique réelle : Pilot et Impact dérivent du brief +
 * du Campaign. Tone affecte uniquement le Campaign (registre rédactionnel,
 * sans incidence sur les KPIs ou le diagnostic Pilot).
 */

import type { ModuleName } from "./enrichment-engine";

export type DependencyKey =
  | `brief.${BriefFieldKey}`
  | `module.${ModuleName}`;

export type BriefFieldKey =
  | "companyContext"
  | "challenge"
  | "audience"
  | "objective"
  | "tone"
  | "constraints";

/**
 * Mapping principal : pour chaque clé surveillée, la liste des modules
 * dont la sortie devient potentiellement obsolète.
 *
 * Important : on ne marque jamais un module comme stale si sa sortie
 * n'a jamais été générée — la liste ici est candidate, le filtrage final
 * se fait dans staleness.ts.
 */
export const DEPENDENCY_MAP: Record<DependencyKey, ModuleName[]> = {
  // Champs brief
  "brief.companyContext": ["campaign", "pilot", "impact"],
  "brief.challenge": ["campaign", "pilot", "impact"],
  "brief.audience": ["campaign", "pilot", "impact"],
  "brief.objective": ["campaign", "pilot", "impact"],
  "brief.tone": ["campaign"],
  "brief.constraints": ["campaign", "pilot"],

  // Cascades inter-modules
  // Quand le Campaign change → Pilot et Impact (qui en héritent) deviennent stale.
  "module.campaign": ["pilot", "impact"],
  // Quand Pilot change → Impact peut s'en nourrir, sans impact remontant sur Campaign.
  "module.pilot": ["impact"],
  // Impact ne propage rien (terminal du flow).
  "module.impact": [],
};

/**
 * Liste des champs brief surveillés — utilisée par le différentiel.
 */
export const TRACKED_BRIEF_FIELDS: BriefFieldKey[] = [
  "companyContext",
  "challenge",
  "audience",
  "objective",
  "tone",
  "constraints",
];

/**
 * Libellés humains pour la bannière. Pas de jargon technique exposé.
 */
export const MODULE_LABELS: Record<ModuleName, string> = {
  campaign: "Campaign",
  pilot: "Pilot",
  impact: "Impact",
};

export const FIELD_LABELS: Record<BriefFieldKey, string> = {
  companyContext: "le contexte entreprise",
  challenge: "la problématique",
  audience: "l'audience cible",
  objective: "l'objectif",
  tone: "le ton de communication",
  constraints: "les contraintes",
};

export function getImpactedModules(key: DependencyKey): ModuleName[] {
  return DEPENDENCY_MAP[key] ?? [];
}
