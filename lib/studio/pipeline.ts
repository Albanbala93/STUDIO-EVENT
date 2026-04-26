/**
 * Campaign Studio — Multi-Step Generation Pipeline
 *
 * Step 1 — Brief analysis   (fast model: deep semantic extraction)
 * Step 2 — Scenario generation (main model: 10–12 diverse candidates)
 * Step 3 — Scoring & selection (fast model: expert jury scoring)
 * Step 4 — Final generation    (main model: full StudioOutput from winner)
 *
 * Falls back to the single-call path if any step fails.
 */

import type {
  BriefAnalysisResult,
  BriefInput,
  PipelineDebugInfo,
  ScenarioCandidate,
  ScenarioScore,
  ScenarioSelectionResult,
  ScoredScenario,
  StudioOutput,
  UserContext,
} from "./types";
import { buildEventPromptContext } from "../eventStrategyEngine";
import { briefToDetectOptions, buildCampaignPrompt, type PipelineContext } from "./prompts";
import { STUDIO_OUTPUT_SCHEMA } from "./output-schema";

/* ============================================================
   SHARED FETCH HELPER
============================================================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function openAICall<T>(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: Record<string, any>,
  schemaName: string
): Promise<T | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Étapes intermédiaires du pipeline (analyse, sélection, etc.) → cap par défaut 1500.
        model,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_output_tokens: 1500,
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            schema,
          },
        },
      }),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as { output_text?: string };
    if (!payload.output_text) return null;
    return JSON.parse(payload.output_text) as T;
  } catch {
    return null;
  }
}

/* ============================================================
   STEP 1 — BRIEF ANALYSIS
   Fast semantic extraction: collectiveNeed, symbolicNeed, register, etc.
   Uses fast model — 2–4 seconds.
============================================================ */

const BRIEF_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    projectType: {
      type: "string",
      enum: [
        "transformation", "crise", "rh-social", "corporate",
        "deploiement-outil", "change-culturel", "reorganisation", "performance",
      ],
    },
    dominantRegister: { type: "string" },
    primaryObjective: { type: "string" },
    emotionalIntent: { type: "string" },
    collectiveNeed: { type: "string" },
    symbolicNeed: { type: "string" },
    mainConstraints: { type: "array", items: { type: "string" } },
    distinctiveSignals: { type: "array", items: { type: "string" } },
  },
  required: [
    "projectType", "dominantRegister", "primaryObjective", "emotionalIntent",
    "collectiveNeed", "symbolicNeed", "mainConstraints", "distinctiveSignals",
  ],
  additionalProperties: false,
};

export async function runBriefAnalysis(
  brief: BriefInput,
  apiKey: string,
  model: string
): Promise<BriefAnalysisResult | null> {
  const prompt = `Analyse ce brief de communication interne. Extrais les éléments sémantiques profonds — pas seulement les mots-clés, mais ce que le brief implique sous la surface.

BRIEF :
- Contexte entreprise : ${brief.companyContext}
- Enjeu prioritaire : ${brief.challenge}
- Cible interne : ${brief.audience}
- Objectif : ${brief.objective}
- Ton attendu : ${brief.tone}
- Contraintes : ${brief.constraints}

INSTRUCTIONS PAR CHAMP :
- projectType : type dominant parmi les valeurs disponibles
- dominantRegister : registre de communication qui correspond le mieux à ce contexte et ce ton (ex: "inspirant", "rassurant-humain", "direct-factuel", "fédérateur-collectif", "institutionnel-solennel", "mobilisateur", "participatif-délibératif")
- primaryObjective : reformule en 1 phrase d'action claire ce que ce brief cherche réellement à accomplir (pas juste l'objectif déclaré — le résultat réel attendu)
- emotionalIntent : ce que le dispositif doit déclencher émotionnellement chez les collaborateurs (ex: "sentiment d'appartenance réaffirmé", "confiance rétablie dans la direction", "fierté collective", "sécurité face à l'incertitude")
- collectiveNeed : ce que le groupe doit vivre ou expérimenter ensemble pour que le dispositif fonctionne (ex: "partager un même moment de bascule symbolique", "construire ensemble une réponse à une question commune", "témoigner mutuellement de leur engagement")
- symbolicNeed : le geste symbolique manquant ou attendu dans ce contexte (ex: "un acte de la direction qui prouve l'engagement au-delà des mots", "un rituel de passage entre l'ancien et le nouveau", "une reconnaissance publique des efforts passés")
- mainConstraints : liste des contraintes réelles du brief (budget, timing, périmètre géographique, culture organisationnelle, contraintes IRP...)
- distinctiveSignals : éléments concrets qui distinguent CE brief d'un autre du même type (chiffres, outils nommés, contexte M&A, tension particulière, population atypique...)`;

  return openAICall<BriefAnalysisResult>(
    apiKey,
    model,
    "Tu es un expert senior en communication interne et psychologie des organisations. Tu analyses les briefs en profondeur. Retourne uniquement le JSON demandé.",
    prompt,
    BRIEF_ANALYSIS_SCHEMA,
    "brief_analysis_v2"
  );
}

/* ============================================================
   STEP 2 — SCENARIO GENERATION
   Generates 10–12 genuinely diverse candidate scenarios.
   Uses main model — 10–15 seconds.
============================================================ */

const SCENARIO_GENERATION_SCHEMA = {
  type: "object",
  properties: {
    scenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          mainFormat: { type: "string" },
          rationale: { type: "string" },
          registerFit: { type: "string" },
          expectedImpact: { type: "string" },
          potentialRisks: { type: "string" },
        },
        required: ["title", "mainFormat", "rationale", "registerFit", "expectedImpact", "potentialRisks"],
        additionalProperties: false,
      },
    },
  },
  required: ["scenarios"],
  additionalProperties: false,
};

export async function runScenarioGeneration(
  brief: BriefInput,
  analysis: BriefAnalysisResult,
  apiKey: string,
  model: string
): Promise<ScenarioCandidate[]> {
  const eventContext = buildEventPromptContext(briefToDetectOptions(brief));

  const prompt = `Tu es un consultant senior en communication interne et événementielle (15+ ans).

BRIEF ANALYSÉ :
- Type de projet : ${analysis.projectType}
- Registre dominant : ${analysis.dominantRegister}
- Objectif primaire : ${analysis.primaryObjective}
- Intention émotionnelle : ${analysis.emotionalIntent}
- Besoin collectif : ${analysis.collectiveNeed}
- Besoin symbolique : ${analysis.symbolicNeed}
- Contraintes : ${analysis.mainConstraints.join(" | ")}
- Signaux distinctifs : ${analysis.distinctiveSignals.join(" | ")}

BRIEF ORIGINAL :
- Enjeu : ${brief.challenge}
- Cible : ${brief.audience}
- Objectif : ${brief.objective}
- Ton : ${brief.tone}
- Contraintes : ${brief.constraints}

CONTEXTE ÉVÉNEMENTIEL MOTEUR :
${eventContext}

MISSION : Génère entre 10 et 12 scénarios de dispositifs de communication internes, GENUINEMENT différents.

RÈGLES DE DIVERSITÉ ABSOLUES :
Chaque scénario doit explorer un angle stratégique distinct. Obligatoire dans l'ensemble :
→ Au moins 1 scénario "léger" (faible ressources, déployable en 72h)
→ Au moins 1 scénario "structurant" (ambitieux, transformation sur 3+ mois)
→ Au moins 1 scénario à forte dimension symbolique (rituel, geste fondateur, rupture visible)
→ Au moins 1 scénario participatif (co-construction, délibération active, pas réception passive)
→ Au moins 1 scénario centré sur les managers comme acteurs principaux (pas juste relais)
→ Au moins 1 scénario digital/asynchrone (podcast interne, vidéo série, plateforme collaborative)
→ Au moins 1 scénario de type "preuve par l'acte" (décision visible de la direction, pas communication)
→ Les scénarios restants explorent d'autres angles : séquençage différent, audience inversée, format inattendu

RÈGLES DE CONTENU OBLIGATOIRES :
- title : nom court et évocateur, non générique (ex: "Le Pacte des Managers" > "Séminaire de transformation")
- mainFormat : format précis et réaliste pour CE contexte (ex: "Série de 5 town halls décentralisés par BU" > "Town hall")
- rationale : 2-3 phrases expliquant pourquoi CE scénario pour CE brief précisément — ancré dans les signaux distinctifs, pas générique
- registerFit : 1 phrase sur l'alignement registre/intention émotionnelle pour ce scénario spécifique
- expectedImpact : impact principal attendu, chiffré ou concret si possible (ex: "100% des managers en capacité d'animer le point équipe sous 5 jours")
- potentialRisks : 1-2 risques spécifiques à CE scénario dans CE contexte (pas "manque d'engagement général")

INTERDITS ABSOLUS :
- Deux scénarios avec le même mainFormat principal
- Rationale non ancré dans le brief (ex: "Ce format est pertinent car il crée de l'engagement")
- "Créer du lien", "fédérer les équipes", "donner du sens" — sans contenu concret
- Scénario qui ignore les contraintes identifiées`;

  const result = await openAICall<{ scenarios: ScenarioCandidate[] }>(
    apiKey,
    model,
    "Tu génères des scénarios de communication interne réellement différents les uns des autres. Chaque scénario est un parti pris stratégique, pas une variation. Retourne uniquement le JSON.",
    prompt,
    SCENARIO_GENERATION_SCHEMA,
    "scenario_generation_v2"
  );

  return result?.scenarios ?? [];
}

/* ============================================================
   STEP 3 — SCORING & SELECTION
   Expert jury scoring on 5 dimensions + penalty.
   Uses fast model — 5–8 seconds.
============================================================ */

type ScoringRawResult = {
  scoredScenarios: Array<{
    title: string;
    scores: ScenarioScore;
    rank: number;
  }>;
  shortlistTitles: string[];
  winnerTitle: string;
  whyWinner: string;
  whyOthersSecondary: string[];
  whyAvoided: string[];
};

const SCORING_SCHEMA = {
  type: "object",
  properties: {
    scoredScenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          scores: {
            type: "object",
            properties: {
              registerAdequacy: { type: "number" },
              objectiveAdequacy: { type: "number" },
              emotionalAdequacy: { type: "number" },
              collectiveNeedAdequacy: { type: "number" },
              constraintCoherence: { type: "number" },
              discouragedFormatPenalty: { type: "number" },
              total: { type: "number" },
            },
            required: [
              "registerAdequacy", "objectiveAdequacy", "emotionalAdequacy",
              "collectiveNeedAdequacy", "constraintCoherence",
              "discouragedFormatPenalty", "total",
            ],
            additionalProperties: false,
          },
          rank: { type: "number" },
        },
        required: ["title", "scores", "rank"],
        additionalProperties: false,
      },
    },
    shortlistTitles: { type: "array", items: { type: "string" } },
    winnerTitle: { type: "string" },
    whyWinner: { type: "string" },
    whyOthersSecondary: { type: "array", items: { type: "string" } },
    whyAvoided: { type: "array", items: { type: "string" } },
  },
  required: [
    "scoredScenarios", "shortlistTitles", "winnerTitle",
    "whyWinner", "whyOthersSecondary", "whyAvoided",
  ],
  additionalProperties: false,
};

export async function runScenarioScoring(
  scenarios: ScenarioCandidate[],
  brief: BriefInput,
  analysis: BriefAnalysisResult,
  apiKey: string,
  model: string
): Promise<ScenarioSelectionResult | null> {
  const scenariosList = scenarios
    .map(
      (s, i) =>
        `Scénario ${i + 1} — "${s.title}"\n` +
        `Format : ${s.mainFormat}\n` +
        `Rationale : ${s.rationale}\n` +
        `Fit registre : ${s.registerFit}\n` +
        `Impact attendu : ${s.expectedImpact}\n` +
        `Risques : ${s.potentialRisks}`
    )
    .join("\n\n");

  const prompt = `Tu es un jury de 3 consultants senior en communication interne. Tu dois noter et sélectionner le meilleur scénario pour ce brief.

BRIEF :
- Enjeu : ${brief.challenge}
- Cible : ${brief.audience}
- Objectif : ${brief.objective}
- Ton : ${brief.tone}
- Contraintes : ${brief.constraints}

ANALYSE SÉMANTIQUE DU BRIEF :
- Type de projet : ${analysis.projectType}
- Registre dominant : ${analysis.dominantRegister}
- Intention émotionnelle : ${analysis.emotionalIntent}
- Besoin collectif : ${analysis.collectiveNeed}
- Besoin symbolique : ${analysis.symbolicNeed}
- Contraintes : ${analysis.mainConstraints.join(", ")}
- Signaux distinctifs : ${analysis.distinctiveSignals.join(" | ")}

SCÉNARIOS À ÉVALUER (${scenarios.length} au total) :
${scenariosList}

GRILLE DE SCORING (chaque dimension sur 10) :
- registerAdequacy : le registre de ce scénario correspond-il au registre dominant "${analysis.dominantRegister}" et à l'intention émotionnelle "${analysis.emotionalIntent}" ? (10 = alignement parfait, 0 = registre opposé)
- objectiveAdequacy : ce scénario atteint-il l'objectif primaire "${analysis.primaryObjective}" de manière directe et vérifiable ? (10 = objectif directement atteint par le format, 0 = pas de lien)
- emotionalAdequacy : ce scénario déclenche-t-il la réponse émotionnelle attendue chez la cible ? (10 = intention émotionnelle parfaitement adressée)
- collectiveNeedAdequacy : ce scénario répond-il au besoin collectif "${analysis.collectiveNeed}" ET au besoin symbolique "${analysis.symbolicNeed}" ? (10 = les deux sont pleinement couverts)
- constraintCoherence : ce scénario est-il réaliste et réalisable dans les contraintes mentionnées ? (10 = parfaitement faisable, 0 = incompatible avec les contraintes)
- discouragedFormatPenalty : ce format est-il contre-indiqué pour ce type de projet "${analysis.projectType}" ? (0 = pas de pénalité, -2 = légèrement inadapté, -5 = fortement déconseillé pour ce type)
- total : somme des 5 premières dimensions + pénalité (max 50)

RÈGLES DE SÉLECTION :
1. Score chaque scénario sur les 6 dimensions — sois exigeant, les notes doivent discriminer
2. Classe par score décroissant (rank 1 = meilleur total)
3. Shortlist : les 3 ou 4 meilleurs scores (pas nécessairement les plus ambitieux — les plus justes pour CE brief)
4. Winner : le scénario qui combine le meilleur score ET le meilleur équilibre registre/objectif/faisabilité
5. Si deux scénarios ont des scores proches, préfère celui dont le mainFormat est le plus ancré dans les signaux distinctifs du brief

RÈGLES RÉDACTIONNELLES :
- whyWinner : 2-3 phrases précises, ancrées dans les signaux distinctifs et les besoins identifiés
- whyOthersSecondary : 1 phrase courte par scénario shortlisté non winner (même nombre d'items que la shortlist moins 1)
- whyAvoided : 3-5 raisons groupées pour l'ensemble des scénarios non shortlistés (pas une ligne par scénario — regroupe les raisons communes)`;

  const raw = await openAICall<ScoringRawResult>(
    apiKey,
    model,
    "Tu es un jury senior d'experts en communication interne. Tu notes des scénarios avec rigueur et impartialité. Retourne uniquement le JSON.",
    prompt,
    SCORING_SCHEMA,
    "scenario_scoring_v2"
  );

  if (!raw) return null;

  // Merge scored data with original candidate details
  const scenarioMap = new Map(scenarios.map((s) => [s.title, s]));

  const scored: ScoredScenario[] = raw.scoredScenarios
    .map((s) => {
      const candidate = scenarioMap.get(s.title);
      if (!candidate) return null;
      return { ...candidate, scores: s.scores, rank: s.rank };
    })
    .filter((s): s is ScoredScenario => s !== null)
    .sort((a, b) => a.rank - b.rank);

  const shortlist = scored.filter((s) => raw.shortlistTitles.includes(s.title));
  const winner = scored.find((s) => s.title === raw.winnerTitle) ?? shortlist[0];

  if (!winner) return null;

  return {
    shortlist,
    winner,
    whyWinner: raw.whyWinner,
    whyOthersSecondary: raw.whyOthersSecondary,
    whyAvoided: raw.whyAvoided,
  };
}

/* ============================================================
   STEP 4 — FINAL GENERATION
   Generates the complete StudioOutput anchored in the winner.
   Uses main model — 15–25 seconds.
============================================================ */

export async function runFinalGeneration(
  brief: BriefInput,
  analysis: BriefAnalysisResult,
  selection: ScenarioSelectionResult,
  userContext: UserContext | null,
  apiKey: string,
  model: string
): Promise<StudioOutput | null> {
  const pipelineContext: PipelineContext = {
    briefAnalysis: analysis,
    selection,
    totalScenariosGenerated: selection.shortlist.length + selection.whyAvoided.length + 2,
  };

  const prompt = buildCampaignPrompt(brief, userContext, pipelineContext);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Étape finale : recommandation stratégique complète (long JSON) → cap absolu 2000.
        model,
        input: [
          {
            role: "system",
            content:
              "Tu es un directeur associé senior en communication interne. Un processus de sélection en 4 étapes a identifié le meilleur scénario. Tu génères la recommandation complète ancrée dans ce scénario. JSON uniquement, aucun texte avant ou après.",
          },
          { role: "user", content: prompt },
        ],
        max_output_tokens: 2000,
        text: {
          format: {
            type: "json_schema",
            name: "final_recommendation_pipeline",
            schema: STUDIO_OUTPUT_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as { output_text?: string };
    if (!payload.output_text) return null;
    return JSON.parse(payload.output_text) as StudioOutput;
  } catch {
    return null;
  }
}

/* ============================================================
   FULL PIPELINE ORCHESTRATOR
   Runs all 4 steps sequentially.
   Returns null if any critical step fails (caller falls back).
============================================================ */

export async function runFullPipeline(
  brief: BriefInput,
  userContext: UserContext | null,
  apiKey: string,
  mainModel: string,
  fastModel: string
): Promise<{ output: StudioOutput; debug: PipelineDebugInfo } | null> {
  // Step 1 — Brief analysis
  const analysis = await runBriefAnalysis(brief, apiKey, fastModel);
  if (!analysis) return null;

  // Step 2 — Scenario generation
  const scenarios = await runScenarioGeneration(brief, analysis, apiKey, mainModel);
  if (scenarios.length < 3) return null; // Too few scenarios to be meaningful

  // Step 3 — Scoring & selection
  const selection = await runScenarioScoring(scenarios, brief, analysis, apiKey, fastModel);
  if (!selection?.winner) return null;

  // Step 4 — Final generation anchored in winner
  const output = await runFinalGeneration(
    brief,
    analysis,
    selection,
    userContext,
    apiKey,
    mainModel
  );
  if (!output) return null;

  // Enrich briefSpecificity from pipeline data if model didn't produce it
  if (!output.briefSpecificity) {
    output.briefSpecificity = {
      whatMakesThisCaseUnique: analysis.distinctiveSignals.slice(0, 4),
      whyThisRecommendationFits: selection.whyWinner,
      whatWasDeliberatelyExcluded: selection.whyAvoided.slice(0, 3),
    };
  }

  const debug: PipelineDebugInfo = {
    briefAnalysis: analysis,
    generatedScenarios: scenarios,
    scenarioSelection: selection,
  };

  return { output, debug };
}
