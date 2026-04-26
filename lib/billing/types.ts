/**
 * Types billing — modèle de plans, entitlements, usage, abonnement.
 *
 * Conçu pour être branché à Stripe sans casser les composants UI :
 *  - PlanId reste stable côté code, mais le label/prix peut changer.
 *  - Les Entitlements sont normalisés (un seul vocabulaire pour toute l'app).
 *  - SubscriptionState et UsageState peuvent être hydratés depuis n'importe
 *    quelle source (localStorage mock aujourd'hui, Stripe + DB demain).
 */

export type PlanId = "discovery" | "create" | "pilot" | "ulteam" | "custom";

export type BillingCycle = "monthly" | "annual";

export type ModuleId = "studio" | "momentum" | "rse";

/**
 * Droits d'usage attachés à un plan. Toute logique de gating dans l'app
 * doit s'appuyer sur ces champs (pas sur le PlanId directement) pour
 * rester insensible aux renommages futurs.
 */
export type Entitlements = {
  /** Modules accessibles avec ce plan. */
  modules: ModuleId[];
  /** Plafond utilisateurs par compte (ou "unlimited"). */
  maxUsers: number | "unlimited";
  /** Plafond de projets par mois calendaire (somme des modules). */
  maxProjectsPerMonth: number | "unlimited";
  /** Profondeur d'historique en jours (ou "unlimited"). */
  historyDays: number | "unlimited";
  /** Export PDF / COMEX activé. */
  exports: boolean;
  /** Achat à la carte (29€/projet) autorisé en complément. */
  aLaCarteAvailable: boolean;
  /** Support prioritaire / CSM. */
  prioritySupport: boolean;
  /** Branding personnalisé sur les exports. */
  customBranding: boolean;
  /** SSO / API / audit log (offre entreprise). */
  enterpriseFeatures: boolean;
};

export type PlanCta = {
  label: string;
  variant: "primary" | "outline" | "dark";
  href: string;
};

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Prix mensuel HT en € — null = "contact" (custom). */
  monthlyPrice: number | null;
  /** Prix annuel HT en € — null = pas d'annuel. */
  annualPrice: number | null;
  /** Marqueur visuel "le plus populaire". */
  popular?: boolean;
  /** Audience cible — affiché en sous-titre. */
  forWho: string;
  /** Bullets visibles sur le pricing. */
  highlights: string[];
  /** CTA principal. */
  cta: PlanCta;
  /** Droits accordés par ce plan. */
  entitlements: Entitlements;
};

/** Module achetable à la carte. */
export type ALaCarteItem = {
  id: ModuleId;
  name: string;
  /** Prix unitaire HT en €. */
  unitPrice: number;
  /** Unité comptée — "projet" pour l'instant. */
  unit: "projet";
  description: string;
};

/** Crédits offerts à l'inscription pour Discovery. */
export type DiscoveryHook = {
  campaignStudioCredits: number;
  momentumMiniDiagnosticCredits: number;
};

/** État courant de l'abonnement (mock localStorage, prêt Stripe). */
export type SubscriptionState = {
  planId: PlanId;
  cycle: BillingCycle;
  /** ISO date d'activation. */
  startedAt: string;
  /** Optionnel — futur Stripe customer id. */
  stripeCustomerId?: string;
  /** Optionnel — futur Stripe subscription id. */
  stripeSubscriptionId?: string;
};

/** Compteurs d'usage du mois calendaire en cours. */
export type UsageState = {
  /** Format YYYY-MM — sert de clé de reset mensuel. */
  monthKey: string;
  studio: number;
  momentum: number;
  rse: number;
};

export type EntitlementCheck =
  | { allowed: true }
  | {
      allowed: false;
      reason: "module-locked" | "quota-reached" | "exports-locked";
    };
