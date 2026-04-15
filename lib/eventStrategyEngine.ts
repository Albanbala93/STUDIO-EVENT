import {
  eventStrategyProfiles,
  type EventStrategyProfile,
} from "./eventStrategyProfiles";

export type EventProjectCategory = keyof typeof eventStrategyProfiles;

export type DetectOptions = {
  title?: string;
  context?: string;
  challenge?: string;
  objective?: string;
  audience?: string;
  constraints?: string;
};

export type DetectedEventProfile = {
  category: EventProjectCategory;
  profile: EventStrategyProfile;
  confidence: number;
  matchedKeywords: string[];
  reasoning: string;
};

export type RankedFormat = {
  format: string;
  score: number;
  source: "primary" | "secondary";
  rationale: string;
};

export type EventRecommendationScenario = {
  category: EventProjectCategory;
  dominantRegister: string;
  strategicIntent: string;
  primaryScenario: string;
  rankedPrimaryFormats: RankedFormat[];
  rankedSecondaryFormats: RankedFormat[];
  discouragedFormats: string[];
  formatsToAvoid: string[];
  mustHaveElements: string[];
  narrative: string;
  managerActivationPatterns: string[];
  beforeDuringAfterPatterns: EventStrategyProfile["beforeDuringAfterPatterns"];
  reasoning: string;
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCorpus(input: DetectOptions): string {
  return normalizeText(
    [
      input.title,
      input.context,
      input.challenge,
      input.objective,
      input.audience,
      input.constraints,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function countKeywordMatches(
  corpus: string,
  keywords: string[],
): { matches: string[]; score: number } {
  const matches: string[] = [];

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedKeyword && corpus.includes(normalizedKeyword)) {
      matches.push(keyword);
    }
  }

  return {
    matches,
    score: matches.length,
  };
}

function getBaseCategoryBoosts(corpus: string): Partial<
  Record<EventProjectCategory, number>
> {
  const boosts: Partial<Record<EventProjectCategory, number>> = {};

  if (
    corpus.includes("anniversaire") ||
    corpus.includes("celebration") ||
    corpus.includes("célébration")
  ) {
    boosts.celebration_symbolic = (boosts.celebration_symbolic ?? 0) + 6;
  }

  if (
    corpus.includes("plan strategique") ||
    corpus.includes("nouvelle strategie") ||
    corpus.includes("vision") ||
    corpus.includes("cap")
  ) {
    boosts.transformation_alignment =
      (boosts.transformation_alignment ?? 0) + 5;
  }

  if (
    corpus.includes("inauguration") ||
    corpus.includes("nouveau site") ||
    corpus.includes("campus") ||
    corpus.includes("nouveau batiment")
  ) {
    boosts.inauguration_showcase =
      (boosts.inauguration_showcase ?? 0) + 6;
  }

  if (
    corpus.includes("demenagement") ||
    corpus.includes("déménagement") ||
    corpus.includes("nouveaux bureaux") ||
    corpus.includes("nouveaux locaux")
  ) {
    boosts.relocation_transition =
      (boosts.relocation_transition ?? 0) + 6;
  }

  if (
    corpus.includes("engagement") ||
    corpus.includes("valeurs") ||
    corpus.includes("culture") ||
    corpus.includes("adhesion") ||
    corpus.includes("adhésion")
  ) {
    boosts.engagement_culture = (boosts.engagement_culture ?? 0) + 4;
  }

  if (
    corpus.includes("onboarding") ||
    corpus.includes("nouveaux arrivants") ||
    corpus.includes("integration") ||
    corpus.includes("intégration")
  ) {
    boosts.onboarding_integration =
      (boosts.onboarding_integration ?? 0) + 5;
  }

  if (
    corpus.includes("kick off") ||
    corpus.includes("kick-off") ||
    corpus.includes("commercial") ||
    corpus.includes("vente") ||
    corpus.includes("sales")
  ) {
    boosts.commercial_mobilization =
      (boosts.commercial_mobilization ?? 0) + 5;
  }

  if (
    corpus.includes("crise") ||
    corpus.includes("incident") ||
    corpus.includes("rumeur") ||
    corpus.includes("urgence")
  ) {
    boosts.crisis_reassurance = (boosts.crisis_reassurance ?? 0) + 7;
  }

  return boosts;
}

export function detectEventProjectCategory(
  input: DetectOptions,
): DetectedEventProfile {
  const corpus = buildCorpus(input);
  const boosts = getBaseCategoryBoosts(corpus);

  let bestCategory: EventProjectCategory = "transformation_alignment";
  let bestScore = -1;
  let bestMatches: string[] = [];

  for (const [category, profile] of Object.entries(
    eventStrategyProfiles,
  ) as [EventProjectCategory, EventStrategyProfile][]) {
    const { matches, score } = countKeywordMatches(
      corpus,
      profile.indicativeKeywords,
    );

    const weightedScore = score + (boosts[category] ?? 0);

    if (weightedScore > bestScore) {
      bestCategory = category;
      bestScore = weightedScore;
      bestMatches = matches;
    }
  }

  const profile = eventStrategyProfiles[bestCategory];

  return {
    category: bestCategory,
    profile,
    confidence: Math.min(100, 35 + bestScore * 10),
    matchedKeywords: bestMatches,
    reasoning:
      bestMatches.length > 0
        ? `Catégorie détectée via les signaux suivants : ${bestMatches.join(", ")}.`
        : "Aucun signal fort détecté, catégorie par défaut retenue selon le contexte dominant.",
  };
}

function buildFormatRationale(
  format: string,
  profile: EventStrategyProfile,
  source: "primary" | "secondary",
): string {
  const reasons: string[] = [];

  if (source === "primary") reasons.push("format central du registre");
  if (profile.collectiveIntensity === "high") {
    reasons.push("répond à un besoin de mobilisation collective forte");
  }
  if (profile.symbolicLevel === "high" && /gala|ceremonie|cérémonie|anniversaire|inauguration/i.test(format)) {
    reasons.push("porte une forte dimension symbolique");
  }
  if (profile.managerialRole === "strong") {
    reasons.push("facilite l’alignement et le relai managérial");
  }

  return reasons.length > 0
    ? reasons.join(", ")
    : "format cohérent avec le registre dominant";
}

function scoreFormat(
  format: string,
  profile: EventStrategyProfile,
  source: "primary" | "secondary",
): number {
  let score = source === "primary" ? 84 : 66;

  const normalizedFormat = normalizeText(format);

  if (profile.collectiveIntensity === "high") {
    if (
      /tous|ensemble|collectif|federateur|federatrice|fédérateur|fédératrice|gala|convention|seminaire|séminaire|town hall|kick off|kick-off|evenement|événement/.test(
        normalizedFormat,
      )
    ) {
      score += 8;
    }
  }

  if (profile.symbolicLevel === "high") {
    if (
      /ceremonie|cérémonie|gala|anniversaire|inauguration|soiree|soirée/.test(
        normalizedFormat,
      )
    ) {
      score += 8;
    }
  }

  if (profile.emotionalLevel === "high") {
    if (
      /soiree|soirée|gala|celebration|célébration|reconnaissance|federatrice|fédératrice/.test(
        normalizedFormat,
      )
    ) {
      score += 6;
    }
  }

  if (profile.managerialRole === "strong") {
    if (/town hall|seminaire|séminaire|kick off|kick-off|workshop/.test(normalizedFormat)) {
      score += 5;
    }
  }

  if (
    profile.discouragedFormats.some(
      (item) => normalizeText(item) === normalizedFormat,
    )
  ) {
    score -= 45;
  }

  if (
    profile.formatsToAvoid.some((item) =>
      normalizedFormat.includes(normalizeText(item)),
    )
  ) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

export function rankFormats(profile: EventStrategyProfile): {
  primary: RankedFormat[];
  secondary: RankedFormat[];
} {
  const primary = profile.primaryFormats
    .map((format) => ({
      format,
      score: scoreFormat(format, profile, "primary"),
      source: "primary" as const,
      rationale: buildFormatRationale(format, profile, "primary"),
    }))
    .sort((a, b) => b.score - a.score);

  const secondary = profile.secondaryFormats
    .map((format) => ({
      format,
      score: scoreFormat(format, profile, "secondary"),
      source: "secondary" as const,
      rationale: buildFormatRationale(format, profile, "secondary"),
    }))
    .sort((a, b) => b.score - a.score);

  return { primary, secondary };
}

export function selectPrimaryScenario(profile: EventStrategyProfile): string {
  const { primary } = rankFormats(profile);
  return primary[0]?.format ?? profile.primaryFormats[0] ?? "événement collectif";
}

export function filterDiscouragedFormats(
  formats: string[],
  profile: EventStrategyProfile,
): string[] {
  return formats.filter((format) => {
    const normalized = normalizeText(format);

    const isDiscouraged = profile.discouragedFormats.some(
      (item) => normalizeText(item) === normalized,
    );

    const isAvoided = profile.formatsToAvoid.some((item) =>
      normalized.includes(normalizeText(item)),
    );

    return !isDiscouraged && !isAvoided;
  });
}

export function hasDiscouragedPrimaryFormat(
  format: string,
  profile: EventStrategyProfile,
): boolean {
  const normalized = normalizeText(format);

  return (
    profile.discouragedFormats.some(
      (item) => normalizeText(item) === normalized,
    ) ||
    profile.formatsToAvoid.some((item) =>
      normalized.includes(normalizeText(item)),
    )
  );
}

export function isMissingMandatoryElements(
  outputText: string,
  profile: EventStrategyProfile,
): {
  missing: string[];
  isValid: boolean;
} {
  const text = normalizeText(outputText);

  const heuristics: Record<string, string[]> = {
    "rassemblement large": [
      "tous les collaborateurs",
      "ensemble des collaborateurs",
      "grande partie des collaborateurs",
      "événement collectif",
      "evenement collectif",
      "rassemblement",
    ],
    "moment symbolique fort": [
      "moment symbolique",
      "temps fort",
      "rituel",
      "cérémonie",
      "ceremonie",
      "prise de parole forte",
    ],
    "reconnaissance collective": [
      "reconnaissance",
      "hommage",
      "remerciement",
      "mise à l’honneur",
      "mise a l honneur",
      "valorisation des équipes",
    ],
    "projection vers l’avenir": [
      "avenir",
      "projection",
      "suite",
      "prochain chapitre",
      "trajectoire",
    ],
    "incarnation du cap": [
      "direction",
      "vision",
      "cap",
      "sponsor",
      "prise de parole de la direction",
    ],
    "alignement collectif": [
      "alignement",
      "moment collectif",
      "appropriation collective",
      "compréhension partagée",
    ],
    "projection claire": [
      "feuille de route",
      "prochaines étapes",
      "vision",
      "projection",
      "trajectoire",
    ],
    "relais managérial": [
      "manager",
      "kit manager",
      "relais managérial",
      "réunion d’équipe",
      "réunions d équipe",
    ],
    "mise en valeur du lieu": [
      "visite",
      "parcours",
      "mise en valeur",
      "découverte des espaces",
      "site",
      "lieu",
    ],
    "moment officiel": [
      "inauguration",
      "officiel",
      "prise de parole",
      "temps officiel",
    ],
    "expérience visiteur": [
      "expérience",
      "immersion",
      "visite guidée",
      "parcours",
    ],
    "dimension vitrine": [
      "vitrine",
      "valorisation",
      "rayonnement",
      "mise en scène",
    ],
    "appropriation des lieux": [
      "appropriation",
      "prise en main",
      "repères",
      "découverte du site",
    ],
    "accompagnement du changement": [
      "accompagnement",
      "transition",
      "changement",
      "prise de repères",
    ],
    "explication des usages": [
      "usages",
      "fonctionnement",
      "mode d’emploi",
      "mode d emploi",
      "repères pratiques",
    ],
    participation: [
      "participation",
      "interaction",
      "contribution",
      "expression",
    ],
    écoute: [
      "écoute",
      "feedback",
      "questions",
      "retours",
    ],
    "co-construction": [
      "co-construction",
      "atelier participatif",
      "contribution collective",
    ],
    "parcours structuré": [
      "parcours",
      "étapes",
      "programme d’intégration",
      "programme d integration",
      "accueil structuré",
    ],
    "moments de rencontre": [
      "rencontre",
      "buddy",
      "sponsor",
      "échanges",
      "mise en relation",
    ],
    "compréhension de l’environnement": [
      "culture",
      "organisation",
      "repères",
      "outils",
      "fonctionnement",
    ],
    énergie: [
      "énergie",
      "dynamique",
      "mobilisation",
      "rythme",
    ],
    "objectifs clairs": [
      "objectifs",
      "priorités",
      "résultats attendus",
      "resultats attendus",
      "cibles",
    ],
    mobilisation: [
      "mobilisation",
      "engagement",
      "activation",
      "mise en mouvement",
    ],
    rapidité: [
      "rapide",
      "immédiat",
      "sans délai",
      "court terme",
    ],
    clarté: [
      "clair",
      "messages clairs",
      "explication simple",
      "lisible",
    ],
    répétition: [
      "régulier",
      "répété",
      "points réguliers",
      "mises à jour",
      "mise à jour",
    ],
    "accessibilité de l’information": [
      "faq",
      "micro-site",
      "micro site",
      "espace central",
      "accessible",
    ],
  };

  const missing = profile.mustHaveElements.filter((item) => {
    const patterns = heuristics[item];
    if (!patterns) return false;
    return !patterns.some((pattern) => text.includes(normalizeText(pattern)));
  });

  return {
    missing,
    isValid: missing.length === 0,
  };
}

export function buildEventRecommendationScenario(
  input: DetectOptions,
): EventRecommendationScenario {
  const detected = detectEventProjectCategory(input);
  const { category, profile } = detected;
  const ranked = rankFormats(profile);
  const primaryScenario = selectPrimaryScenario(profile);

  return {
    category,
    dominantRegister: profile.dominantRegister,
    strategicIntent: profile.strategicIntent,
    primaryScenario,
    rankedPrimaryFormats: ranked.primary,
    rankedSecondaryFormats: ranked.secondary,
    discouragedFormats: profile.discouragedFormats,
    formatsToAvoid: profile.formatsToAvoid,
    mustHaveElements: profile.mustHaveElements,
    narrative: profile.recommendedNarrative,
    managerActivationPatterns: profile.managerActivationPatterns,
    beforeDuringAfterPatterns: profile.beforeDuringAfterPatterns,
    reasoning: detected.reasoning,
  };
}

export function buildEventPromptContext(input: DetectOptions): string {
  const scenario = buildEventRecommendationScenario(input);

  return [
    `REGISTRE DOMINANT : ${scenario.dominantRegister}`,
    `INTENTION STRATÉGIQUE : ${scenario.strategicIntent}`,
    `SCÉNARIO PRINCIPAL À PRIVILÉGIER : ${scenario.primaryScenario}`,
    `FORMATS PRINCIPAUX RECOMMANDÉS : ${scenario.rankedPrimaryFormats
      .map((item) => `${item.format} (${item.score}/100)`)
      .join(" ; ")}`,
    `FORMATS COMPLÉMENTAIRES UTILES : ${scenario.rankedSecondaryFormats
      .slice(0, 5)
      .map((item) => `${item.format} (${item.score}/100)`)
      .join(" ; ")}`,
    `FORMATS DÉCONSEILLÉS : ${scenario.discouragedFormats.join(" ; ")}`,
    `FORMATS À ÉVITER : ${scenario.formatsToAvoid.join(" ; ")}`,
    `INCONTOURNABLES MÉTIER : ${scenario.mustHaveElements.join(" ; ")}`,
    `NARRATIVE RECOMMANDÉE : ${scenario.narrative}`,
    `ACTIVATION MANAGERS : ${scenario.managerActivationPatterns.join(" ; ")}`,
    `AVANT : ${scenario.beforeDuringAfterPatterns.before.join(" ; ")}`,
    `PENDANT : ${scenario.beforeDuringAfterPatterns.during.join(" ; ")}`,
    `APRÈS : ${scenario.beforeDuringAfterPatterns.after.join(" ; ")}`,
    `RAISONNEMENT DE CLASSEMENT : ${scenario.reasoning}`,
  ].join("\n");
}

export function buildCriticInstructions(input: DetectOptions): string {
  const scenario = buildEventRecommendationScenario(input);

  return [
    `Tu agis comme un relecteur stratégique senior.`,
    `Tu dois vérifier que le scénario principal proposé respecte le registre : ${scenario.dominantRegister}.`,
    `Le format principal attendu doit être cohérent avec : ${scenario.primaryScenario}.`,
    `Tu dois rejeter ou corriger toute recommandation utilisant comme format principal l’un des formats déconseillés suivants : ${scenario.discouragedFormats.join(", ")}.`,
    `Tu dois également rejeter les formats à éviter suivants : ${scenario.formatsToAvoid.join(", ")}.`,
    `Tu dois vérifier que les éléments incontournables sont bien présents : ${scenario.mustHaveElements.join(", ")}.`,
    `Si un format est possible mais culturellement ou stratégiquement inadapté, tu dois l’écarter.`,
    `Tu dois préférer une recommandation plus simple mais juste à une recommandation riche mais incohérente.`,
  ].join("\n");
}