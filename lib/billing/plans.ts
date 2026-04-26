import type {
  ALaCarteItem,
  DiscoveryHook,
  Plan,
  PlanId,
} from "./types";

/**
 * Catalogue des plans Stratly.
 *
 * Convention de nommage : on conserve PlanId stable pour le code (gating,
 * URLs), tout en autorisant le `name` à évoluer librement côté marketing.
 */
export const PLANS: Record<PlanId, Plan> = {
  discovery: {
    id: "discovery",
    name: "Découverte",
    tagline: "1 campagne + 1 mini-diagnostic offerts",
    monthlyPrice: 0,
    annualPrice: 0,
    forWho: "Pour tester avant de vous engager",
    highlights: [
      "1 brief Campaign Studio offert",
      "1 mini-diagnostic Momentum offert",
      "Lecture seule du volet RSE",
      "Export PDF désactivé",
      "1 utilisateur",
    ],
    cta: {
      label: "Démarrer gratuitement",
      variant: "primary",
      href: "/studio/new",
    },
    entitlements: {
      modules: ["studio", "momentum"],
      maxUsers: 1,
      maxProjectsPerMonth: 2,
      historyDays: 30,
      exports: false,
      aLaCarteAvailable: true,
      prioritySupport: false,
      customBranding: false,
      enterpriseFeatures: false,
    },
  },

  create: {
    id: "create",
    name: "Create",
    tagline: "Pour produire vos campagnes",
    monthlyPrice: 149,
    annualPrice: 1490,
    forWho: "DirCom solo, équipe communication serrée",
    highlights: [
      "Campaign Studio en illimité",
      "Jusqu'à 5 projets par mois",
      "Export PDF complet",
      "1 utilisateur",
      "Historique 90 jours",
    ],
    cta: {
      label: "Choisir Create",
      variant: "outline",
      href: "/compte?plan=create",
    },
    entitlements: {
      modules: ["studio"],
      maxUsers: 1,
      maxProjectsPerMonth: 5,
      historyDays: 90,
      exports: true,
      aLaCarteAvailable: true,
      prioritySupport: false,
      customBranding: false,
      enterpriseFeatures: false,
    },
  },

  pilot: {
    id: "pilot",
    name: "Pilot",
    tagline: "Pour piloter aussi la performance",
    monthlyPrice: 349,
    annualPrice: 3490,
    popular: true,
    forWho: "Direction comm avec besoin de mesure",
    highlights: [
      "Campaign Studio + Momentum",
      "Jusqu'à 10 projets par mois",
      "Exports PDF + tableurs",
      "3 utilisateurs",
      "Historique 1 an",
      "Support prioritaire",
    ],
    cta: {
      label: "Choisir Pilot",
      variant: "primary",
      href: "/compte?plan=pilot",
    },
    entitlements: {
      modules: ["studio", "momentum"],
      maxUsers: 3,
      maxProjectsPerMonth: 10,
      historyDays: 365,
      exports: true,
      aLaCarteAvailable: true,
      prioritySupport: true,
      customBranding: false,
      enterpriseFeatures: false,
    },
  },

  ulteam: {
    id: "ulteam",
    name: "ULTEAM",
    tagline: "Performance + impact RSE intégrés",
    monthlyPrice: 950,
    annualPrice: 9500,
    forWho: "COMEX, directions Communication & RSE",
    highlights: [
      "Tous les modules : Studio + Momentum + RSE",
      "Projets en illimité",
      "10 utilisateurs",
      "Tous les exports + dossier COMEX",
      "Historique illimité",
      "Branding personnalisé",
      "CSM dédié",
    ],
    cta: {
      label: "Choisir ULTEAM",
      variant: "dark",
      href: "/compte?plan=ulteam",
    },
    entitlements: {
      modules: ["studio", "momentum", "rse"],
      maxUsers: 10,
      maxProjectsPerMonth: "unlimited",
      historyDays: "unlimited",
      exports: true,
      aLaCarteAvailable: false,
      prioritySupport: true,
      customBranding: true,
      enterpriseFeatures: false,
    },
  },

  custom: {
    id: "custom",
    name: "Sur mesure",
    tagline: "Volume, SSO, intégrations spécifiques",
    monthlyPrice: null,
    annualPrice: null,
    forWho: "Grands comptes & contraintes spécifiques",
    highlights: [
      "Tout ULTEAM",
      "Utilisateurs illimités",
      "SSO entreprise + audit log",
      "Accès API + intégrations sur mesure",
      "SLA et accompagnement dédié",
    ],
    cta: {
      label: "Nous contacter",
      variant: "outline",
      href: "mailto:contact@stratly.io?subject=Devis%20Stratly%20sur%20mesure",
    },
    entitlements: {
      modules: ["studio", "momentum", "rse"],
      maxUsers: "unlimited",
      maxProjectsPerMonth: "unlimited",
      historyDays: "unlimited",
      exports: true,
      aLaCarteAvailable: true,
      prioritySupport: true,
      customBranding: true,
      enterpriseFeatures: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = [
  "discovery",
  "create",
  "pilot",
  "ulteam",
  "custom",
];

/** Plans affichés dans la grille principale du pricing (custom est traité à part). */
export const PRICING_GRID: PlanId[] = ["create", "pilot", "ulteam"];

export const A_LA_CARTE: ALaCarteItem[] = [
  {
    id: "studio",
    name: "Campaign Studio",
    unitPrice: 29,
    unit: "projet",
    description: "Un brief complet → un dossier exploitable",
  },
  {
    id: "momentum",
    name: "Momentum",
    unitPrice: 29,
    unit: "projet",
    description: "Un diagnostic 4 dimensions + score consolidé",
  },
  {
    id: "rse",
    name: "Volet RSE",
    unitPrice: 29,
    unit: "projet",
    description: "Un volet ESG aligné CSRD",
  },
];

export const DISCOVERY_HOOK: DiscoveryHook = {
  campaignStudioCredits: 1,
  momentumMiniDiagnosticCredits: 1,
};

export function getPlan(id: PlanId): Plan {
  return PLANS[id] ?? PLANS.discovery;
}

/**
 * Plan recommandé pour débloquer un module donné.
 * Retourne le plan le moins cher qui inclut le module demandé.
 */
export function recommendedPlanForModule(module: "studio" | "momentum" | "rse"): Plan {
  if (module === "rse") return PLANS.ulteam;
  if (module === "momentum") return PLANS.pilot;
  return PLANS.create;
}
