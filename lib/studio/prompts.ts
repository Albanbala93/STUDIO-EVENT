import type { BriefAnalysis, BriefAnalysisResult, BriefInput, ProjectType, ScenarioSelectionResult, UserContext } from "./types";
import {
  buildEventPromptContext,
  type DetectOptions,
} from "../eventStrategyEngine";

/* ============================================================
   BRIEF → ENGINE ADAPTER
============================================================ */

/**
 * Maps BriefInput fields to the engine's DetectOptions shape.
 */
export function briefToDetectOptions(input: BriefInput): DetectOptions {
  return {
    context: input.companyContext,
    challenge: input.challenge,
    audience: input.audience,
    objective: input.objective,
    constraints: input.constraints,
  };
}

/**
 * Taxonomy category for the event copilot format grid.
 * Separate from EventProjectCategory — used in format cards.
 */
export function detectEventCategory(input: BriefInput): string {
  const text = `${input.challenge} ${input.objective} ${input.companyContext} ${input.constraints}`.toLowerCase();
  if (/crise|accident|urgence|tension sociale|conflit|rumeur|incident|alerte/.test(text)) return "communication-crise";
  if (/kick.?off|commercial|vente|objectif commercial|sales|chiffre d.affaires|client|pipeline/.test(text)) return "engagement-commercial";
  if (/fusion|acquisition|rachat|regroupement|intégration d.équipe|nouvelle organisation|business review/.test(text)) return "nouvelle-organisation";
  if (/onboarding|accueil|intégration|arrivée|recrutement|buddy/.test(text)) return "onboarding";
  if (/erp|logiciel|outil|déploiement|implémentation|digital|plateforme|teams|salesforce|process/.test(text)) return "mise-en-oeuvre";
  if (/anniversaire|célébr|récompense|bravo|succès|soirée|afterwork|gala|fête/.test(text)) return "celebration-reconnaissance";
  if (/culture|valeur|identit|transformation culturelle|posture/.test(text)) return "sensibilisation-changement";
  return "sensibilisation-changement";
}

/* ============================================================
   BRIEF ANALYSIS LAYER
   Extracts concrete, specific signals from the brief text.
   These signals are injected into the prompt to force
   non-duplicable, brief-anchored recommendations.
============================================================ */

/**
 * Extracts distinctive signals from brief fields.
 * Returns a structured analysis used to personalize generation.
 */
export function analyzeBrief(input: BriefInput): BriefAnalysis {
  const fullText = `${input.companyContext} ${input.challenge} ${input.audience} ${input.objective} ${input.constraints}`;
  const lower = fullText.toLowerCase();
  const toneLower = input.tone.toLowerCase();

  // ── Numbers with meaningful units ──────────────────────────────
  const numberMatches =
    fullText.match(
      /\b\d[\d\s]*(?:collaborateurs?|employés?|personnes?|équipes?|sites?|pays|agences?|BU|filiales?|%|k€|M€|millions?|milliards?|mois|semaines?|jours?|ans?|heures?|utilisateurs?|managers?)\b/gi
    ) ?? [];

  // ── Named tools / platforms ─────────────────────────────────────
  const KNOWN_TOOLS = [
    "SAP", "S/4HANA", "Salesforce", "Teams", "SharePoint", "Workday",
    "ServiceNow", "Oracle", "Power BI", "Slack", "Zoom", "Google Workspace",
    "Office 365", "Dynamics", "Jira", "Confluence", "Ariba", "SuccessFactors",
    "Talend", "Tableau", "Databricks",
  ];
  const detectedTools = KNOWN_TOOLS.filter((t) =>
    fullText.toLowerCase().includes(t.toLowerCase())
  );

  // ── Geographic / org scope ──────────────────────────────────────
  const scopeSignals: string[] = [];
  if (/monde|mondial|international|global/.test(lower)) scopeSignals.push("périmètre mondial");
  if (/europe|européen/.test(lower)) scopeSignals.push("périmètre européen");
  if (/france métropolitaine|national(?! de l)/.test(lower)) scopeSignals.push("périmètre France");
  if (/multi.?site|plusieurs sites?|établissements?|usines?|agences?/.test(lower)) scopeSignals.push("organisation multi-sites");
  if (/siège|corporate|headquarter|head office/.test(lower)) scopeSignals.push("niveau siège / corporate");
  if (/terrain|opérationnel|proximit|atelier|entrepôt/.test(lower)) scopeSignals.push("populations terrain / opérationnelles");
  if (/hybride|télétravail|distanciel|remote/.test(lower)) scopeSignals.push("organisation hybride / distanciel");

  // ── Urgency signals ─────────────────────────────────────────────
  const urgencySignals: string[] = [];
  if (/urgent|impératif|immédiat|dès maintenant|sans délai|ASAP/.test(lower)) urgencySignals.push("urgence critique");
  if (/avant le|d'ici|deadline|échéance contrainte|délai ferme/.test(lower)) urgencySignals.push("échéance contrainte identifiée");
  if (/lancement(?! d'offre)|kick.?off|go.?live|démarrage/.test(lower)) urgencySignals.push("lancement imminent");

  // ── Budget / resource signals ───────────────────────────────────
  const budgetSignals: string[] = [];
  if (/budget limit|budget serr|sans budget additionnel|ressources? limit|budget réduit|peu de budget/.test(lower)) budgetSignals.push("contrainte budgétaire forte");
  if (/budget dédié|budget alloué|investissement prévu|ressources disponibles/.test(lower)) budgetSignals.push("budget disponible confirmé");

  // ── Context / trigger signals ───────────────────────────────────
  const contextSignals: string[] = [];
  if (/fusion|acquisition|rachat|rapprochement|M&A/.test(lower)) contextSignals.push("contexte M&A / fusion-acquisition");
  if (/crise|tension sociale|conflit|incident grave|rumeur/.test(lower)) contextSignals.push("contexte de crise avérée");
  if (/croissance|expansion|recrutement massif|hypercroissance/.test(lower)) contextSignals.push("phase de croissance");
  if (/restructur|réorganis|plan social|pse|suppression/.test(lower)) contextSignals.push("restructuration / réorganisation");
  if (/transformation digitale|digitalisation|data|IA|intelligence artificielle/.test(lower)) contextSignals.push("transformation digitale / tech");
  if (/culture|valeurs?|raison d.être|purpose|marque employeur/.test(lower)) contextSignals.push("enjeu culturel / identitaire");
  if (/performance|objectifs?|résultats?|plan de performance|kpi/.test(lower)) contextSignals.push("enjeu de performance opérationnelle");

  // ── Dominant register from tone ─────────────────────────────────
  let dominantRegister = "neutre-professionnel";
  if (/inspirant|motivant|enthousias|énergi|optimiste/.test(toneLower)) dominantRegister = "inspirant";
  if (/rassurant|bienveillant|empathique|humain|chaleureux/.test(toneLower)) dominantRegister = "rassurant-humain";
  if (/direct|factuel|concis|pragmatique|efficace/.test(toneLower)) dominantRegister = "direct-factuel";
  if (/fédérateur|collectif|ensemble|communaut/.test(toneLower)) dominantRegister = "fédérateur-collectif";
  if (/engag|mobilisateur|dynamique/.test(toneLower)) dominantRegister = "mobilisateur";
  if (/solennel|sérieux|institutionnel/.test(toneLower)) dominantRegister = "institutionnel-solennel";

  // ── Emotional intent from text ──────────────────────────────────
  let emotionalIntent = "aligner et mobiliser";
  if (/rassurer|confiance|sécuriser|apaiser/.test(lower)) emotionalIntent = "rassurer et sécuriser";
  if (/célébr|fêter|reconnaître|valoriser|succès|réussite/.test(lower)) emotionalIntent = "célébrer et valoriser";
  if (/engager|adhérer|convaincre|faire adopter/.test(lower)) emotionalIntent = "engager et faire adhérer";
  if (/informer|expliquer|clarifier|comprendre/.test(lower)) emotionalIntent = "informer et clarifier";
  if (/mobiliser|motiver|stimuler|dynamiser/.test(lower)) emotionalIntent = "mobiliser vers l'action";

  // ── Distinctive signals composite ──────────────────────────────
  const distinctiveSignals: string[] = [
    ...numberMatches.slice(0, 4).map((n) => `Données chiffrées : "${n.trim()}"`),
    ...detectedTools.map((t) => `Outil/plateforme nommé : ${t}`),
    ...scopeSignals,
    ...urgencySignals,
    ...budgetSignals,
    ...contextSignals,
  ].filter(Boolean);

  // ── Secondary objectives ────────────────────────────────────────
  const secondaryObjectives: string[] = [];
  if (/sens|comprendre|adhésion|appropriation|faire comprendre/.test(lower)) secondaryObjectives.push("Construire le sens et l'adhésion");
  if (/ambassad|relai|manager|sponsor/.test(lower)) secondaryObjectives.push("Activer le réseau de relais managériaux");
  if (/mesurer|kpi|adopt|suivi|indicateur/.test(lower)) secondaryObjectives.push("Mesurer l'adoption et les comportements réels");
  if (/réduire|limiter|prévenir|risque|résistance/.test(lower)) secondaryObjectives.push("Réduire les résistances et les angles morts");
  if (/pérenniser|ancrer|durée|long terme|maintenir/.test(lower)) secondaryObjectives.push("Ancrer dans la durée et éviter l'effet soufflé");

  const projectType = detectProjectType(input);

  return {
    projectType,
    primaryObjective: input.objective,
    secondaryObjectives: secondaryObjectives.length > 0
      ? secondaryObjectives
      : ["Ancrer les comportements cibles dans la durée"],
    dominantAudience: input.audience || "ensemble des collaborateurs",
    dominantRegister,
    emotionalIntent,
    mainConstraint: input.constraints || "non spécifiée",
    successDefinition: input.objective,
    distinctiveSignals: distinctiveSignals.length > 0
      ? distinctiveSignals
      : ["Brief sans signaux distinctifs numériques — recommandation basée sur le type et le registre"],
  };
}

/**
 * Formats the brief analysis as an injectable prompt block.
 * This block forces the model to anchor recommendations in specific signals.
 */
function buildBriefAnalysisBlock(analysis: BriefAnalysis): string {
  return `ANALYSE STRUCTURÉE DU BRIEF — Ces signaux DOIVENT apparaître explicitement dans ta recommandation :

Type de projet détecté : ${analysis.projectType.toUpperCase()}
Objectif principal : ${analysis.primaryObjective}
Objectifs secondaires : ${analysis.secondaryObjectives.join(" | ")}
Audience dominante : ${analysis.dominantAudience}
Registre dominant : ${analysis.dominantRegister}
Intention émotionnelle : ${analysis.emotionalIntent}
Contrainte principale : ${analysis.mainConstraint}
Définition du succès : ${analysis.successDefinition}

SIGNAUX DISTINCTIFS (à intégrer dans les sections concernées) :
${analysis.distinctiveSignals.map((s) => `→ ${s}`).join("\n")}

RÈGLE D'ANCRAGE : Chaque signal ci-dessus doit être visible dans au moins une section du dossier.
Un signal non utilisé = une recommandation trop générique = une révision obligatoire.`;
}

/* ============================================================
   PROJECT TYPE DETECTION
   Deterministic classification from brief content.
============================================================ */

export function detectProjectType(input: BriefInput): ProjectType {
  const text = `${input.challenge} ${input.objective} ${input.companyContext}`.toLowerCase();

  if (/crise|accident|urgence|tension sociale|conflit|rumeur|incident|alerte/.test(text)) return "crise";
  if (/erp|si |logiciel|outil|déploiement|implémentation|formation|digital|plateforme|teams|salesforce/.test(text)) return "deploiement-outil";
  if (/emploi|poste|mobil|gpec|licencie|pse|plan social|bien-être|rps|burn|rh|social/.test(text)) return "rh-social";
  if (/fusion|acquisition|rachat|culture|valeur|identit|marque employeur/.test(text)) return "change-culturel";
  if (/réorganis|restructur|refonte|réorgani|scission|branche|périmètre/.test(text)) return "reorganisation";
  if (/performance|objectif|résultat|kpi|efficacit|productiv|croissance|plan de/.test(text)) return "performance";
  if (/stratégi|vision|cap|ambition|plan|corporate|raison d'être|purpose/.test(text)) return "corporate";
  return "transformation";
}

/* ============================================================
   STRUCTURAL LENS PER PROJECT TYPE
   Each type gets a fundamentally different structural logic.
============================================================ */

function getStructuralLens(type: ProjectType): string {
  switch (type) {
    case "crise":
      return `
LENTILLE CRISE — Vitesse et crédibilité priment sur tout.
- La timeline s'exprime en HEURES et JOURS (jamais en semaines sur les 72 premières heures)
- Premier message : dans les 4h maximum — chaque heure de silence renforce la rumeur
- La FAQ est le livrable n°1, avant l'email direction
- Nommer explicitement ce qui est incertain : "Nous ne savons pas encore X. Nous le dirons dès que..."
- Ne JAMAIS promettre ce qu'on ne peut pas tenir
- L'angle stratégique doit être une posture (transparence radicale / maîtrise de l'agenda / protection des personnes)
- Interdire toute formulation "positive spin" : les gens voient à travers`;

    case "deploiement-outil":
      return `
LENTILLE DÉPLOIEMENT OUTIL — L'adoption est l'enjeu réel, pas la communication.
- Structurer en 3 phases : AVANT (anticipation des résistances), PENDANT (accompagnement à l'usage), APRÈS (ancrage et optimisation)
- Les quick wins sont des micro-victoires d'utilisation concrète, pas des victoires de communication
- Les KPIs mesurent l'adoption réelle : taux de connexion, nombre de transactions, taux de complétion — jamais le sentiment
- Le kit manager = guide pratique de réponse aux problèmes terrain, pas un argumentaire
- Les résistances à nommer : peur de perdre ses repères, charge supplémentaire, sentiment d'infantilisation
- L'angle stratégique doit répondre à "pourquoi cet outil m'aide, moi" (bénéfice individuel), pas "pourquoi l'entreprise en a besoin"`;

    case "rh-social":
      return `
LENTILLE RH-SOCIAL — L'impact individuel précède l'impact collectif.
- Chaque message doit répondre à "Qu'est-ce que ça change pour MOI, maintenant ?" — pas pour "l'entreprise"
- Les managers sont des accompagnateurs individuels, pas des porte-paroles institutionnels
- La FAQ doit traiter les cas sensibles et les situations particulières, pas les généralités
- Éviter tout discours positif non ancré dans du concret (wellbeing theater)
- L'angle stratégique doit incarner la posture de l'entreprise sur l'humain — pas juste la communiquer
- Identifier les populations les plus exposées et différencier l'approche pour elles`;

    case "change-culturel":
      return `
LENTILLE CHANGEMENT CULTUREL — Les mots ne changent pas les cultures, les comportements si.
- L'angle central doit être comportemental, pas déclaratif ("nous faisons X" plutôt que "nous croyons en Y")
- Les preuves par les actes (décisions, exemples, gestes symboliques) priment sur les discours
- Le dispositif doit créer des EXPÉRIENCES, pas des communications
- Identifier des "petites victoires culturelles visibles" pour J+15 — des gestes que tout le monde peut observer
- Interdire les formulations abstraites : valeurs, culture, vision — tout doit être traduit en comportement observable
- Le changement culturel prend 18 mois minimum : le dispositif doit prévoir une phase longue, pas juste un lancement`;

    case "reorganisation":
      return `
LENTILLE RÉORGANISATION — La rumeur précède toujours l'annonce officielle.
- Vitesse > perfection : communiquer imparfaitement mais rapidement vaut mieux qu'attendre
- Distinguer sans ambiguïté : ce qui est DÉCIDÉ (non négociable) vs ce qui est OUVERT (co-construction possible)
- Les managers doivent être briefés AVANT les collaborateurs — délai minimum 24h, idéalement 48h
- Anticiper impérativement les questions sur l'emploi, les périmètres, les hiérarchies
- La première communication doit donner une date précise pour la prochaine — jamais de "nous reviendrons vers vous"
- L'angle doit nommer le changement sans l'édulcorer : les collaborateurs préfèrent une mauvaise nouvelle claire à du brouillard`;

    case "performance":
      return `
LENTILLE PERFORMANCE — La pression sans légitimité génère du retrait, pas de la mobilisation.
- L'angle doit répondre à "pourquoi maintenant et pourquoi nous ?" — la légitimité de la demande
- Distinguer les équipes en surperformance (encouragement, cap maintenu) des équipes en difficulté (accompagnement, pas pression)
- Les KPIs de communication mesurent la clarté de la cible et la confiance dans les moyens, pas l'ambiance
- Le kit manager est un outil de dialogue individuel, pas d'injonction collective
- Nommer les efforts demandés explicitement — ne pas les minimiser ou les habiller
- Interdire le management par la peur dans les contenus : aucune formulation implicitement menaçante`;

    case "corporate":
      return `
LENTILLE CORPORATE — L'alignement vertical conditionne la crédibilité horizontale.
- Vérifier l'alignement CODIR avant le lancement : un seul message dissonant détruit la crédibilité du tout
- Le message "descendant" doit être traduit localement — pas rediffusé tel quel par les N+1
- Les "preuves d'engagement de la direction" (décisions, visites, actes) sont plus persuasives que les discours
- Calibrer l'ambition selon la capacité d'absorption : trop d'enjeux simultanés → aucun n'est retenu
- L'angle doit répondre à "où va-t-on et pourquoi maintenant ?" — pas juste "voici notre plan"
- Identifier les signaux faibles d'incompréhension terrain : des Q&A locaux, des non-dits en réunion`;

    default: // transformation
      return `
LENTILLE TRANSFORMATION — L'adhésion se construit en étapes, pas en un message.
- Structurer en avant/pendant/après avec des RITUELS de transition clairs et visibles
- Identifier et activer les ambassadeurs internes dès J+0 : ils incarnent le changement avant que tout le monde y adhère
- Le changement de comportement PRÉCÈDE le changement d'adhésion — il faut des quick wins comportementaux
- Mesurer l'adoption comportementale (ce que les gens FONT), pas le sentiment (ce qu'ils DISENT)
- L'angle stratégique doit être un récit de transformation crédible — pas un catalogue d'actions
- Anticiper la résistance passive : les gens ne s'opposent pas, ils attendent que ça passe`;
  }
}

/* ============================================================
   VARIATION DIRECTIVE
   Deterministic but brief-specific structural approach.
   Prevents two similar briefs from getting the same treatment.
============================================================ */

const VARIATION_LENSES = [
  `PRISME D'ENTRÉE : Commence par identifier LE moment de bascule — l'instant précis où la résistance peut se transformer en adhésion. Construis tout le dispositif autour de ce pivot temporel.`,

  `PRISME D'ENTRÉE : Identifie l'audience la plus difficile à convaincre (pas la plus nombreuse). Construis l'intégralité du dispositif pour résoudre sa résistance spécifique. Les autres publics suivront naturellement.`,

  `PRISME D'ENTRÉE : Commence par ce qui va mal. Nomme explicitement l'échec possible le plus probable si rien n'est fait correctement. Construis le dispositif comme une réponse directe à ce risque.`,

  `PRISME D'ENTRÉE : Cherche la contradiction centrale du brief — ce qu'on demande vs ce qu'on peut réellement tenir. Fais de cette tension la clé de l'angle stratégique. L'honnêteté sur la tension est plus crédible que sa dissimulation.`,

  `PRISME D'ENTRÉE : Identifie le momentum naturel — un événement existant (réunion annuelle, bilan, lancement produit) sur lequel greffer ce dispositif sans effort supplémentaire. La communication qui s'inscrit dans un tempo existant coûte deux fois moins cher.`,

  `PRISME D'ENTRÉE : Demande-toi ce que les collaborateurs pensent DÉJÀ avant que la communication démarre. Construis l'angle pour partir de cette représentation initiale — pas pour la court-circuiter, mais pour l'adresser frontalement.`,

  `PRISME D'ENTRÉE : Identifie le groupe le plus susceptible de devenir ambassadeur involontaire du changement (pas les convaincus — ceux qui doutaient et qui ont été convertis). Construis le dispositif pour créer ces conversions visibles.`,
];

export function getVariationDirective(input: BriefInput): string {
  const seed = (
    input.companyContext.length * 3 +
    input.challenge.length * 7 +
    input.audience.length * 11 +
    input.objective.length * 5
  ) % VARIATION_LENSES.length;
  return VARIATION_LENSES[seed];
}

/* ============================================================
   MAIN PROMPT BUILDER
============================================================ */

export function buildUserContextBlock(ctx: UserContext | null | undefined): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.sector) parts.push(`- Secteur habituel du client : ${ctx.sector}`);
  if (ctx.frequentProjectTypes?.length) parts.push(`- Types de projets fréquents : ${ctx.frequentProjectTypes.join(", ")}`);
  if (ctx.preferredTone) parts.push(`- Ton habituellement retenu : ${ctx.preferredTone}`);
  if (ctx.recentTopics?.length) parts.push(`- Sujets traités récemment (à NE PAS répéter en angle) : ${ctx.recentTopics.join(", ")}`);
  if (!parts.length) return "";
  return `\nCONTEXTE UTILISATEUR (mémoire des sessions précédentes) :\n${parts.join("\n")}\n→ Tiens compte de ce contexte pour différencier ce dispositif des précédents.\n`;
}

/* ============================================================
   PIPELINE CONTEXT INJECTION
   When the multi-step pipeline is used, the winner scenario
   and expert reasoning are injected into the final generation
   prompt so the model is anchored from the start.
============================================================ */

export type PipelineContext = {
  briefAnalysis: BriefAnalysisResult;
  selection: ScenarioSelectionResult;
  totalScenariosGenerated: number;
};

function buildWinnerContextBlock(ctx: PipelineContext): string {
  const { selection, totalScenariosGenerated } = ctx;
  const { winner, shortlist, whyWinner, whyOthersSecondary, whyAvoided } = selection;
  const secondaryItems = shortlist.filter(s => s.title !== winner.title);

  return `
════════════════════════════════════════
SCÉNARIO ÉLU — PROCESSUS DE SÉLECTION EN 4 ÉTAPES
(${totalScenariosGenerated} scénarios générés → scorés → shortlistés → winner choisi)
════════════════════════════════════════

SCÉNARIO RETENU : "${winner.title}"
Format principal : ${winner.mainFormat}
Rationale de sélection : ${winner.rationale}
Fit registre : ${winner.registerFit}
Impact attendu : ${winner.expectedImpact}
Risques à anticiper : ${winner.potentialRisks}

POURQUOI CE SCÉNARIO A ÉTÉ ÉLU :
${whyWinner}
${secondaryItems.length > 0 ? `
SCÉNARIOS SHORTLISTÉS (secondaires — à mentionner dans challengeMode) :
${secondaryItems.map((s, i) => `- "${s.title}" (${s.mainFormat}) — secondaire car : ${whyOthersSecondary[i] ?? "contexte moins favorable"}`).join("\n")}` : ""}
${whyAvoided.length > 0 ? `
SCÉNARIOS ÉCARTÉS (à citer dans challengeMode.alternatives si pertinent) :
${whyAvoided.map(r => `- ${r}`).join("\n")}` : ""}

RÈGLE D'ANCRAGE ABSOLUE :
L'intégralité de la recommandation doit être ancrée dans le scénario "${winner.title}".
→ L'architecture du dispositif DOIT refléter le format "${winner.mainFormat}"
→ Les quick wins doivent être des victoires propres à ce format, pas génériques
→ challengeMode DOIT mentionner les scénarios shortlistés comme alternatives crédibles
→ La critique principale dans challengeMode DOIT cibler le risque principal du winner ("${winner.potentialRisks.split(".")[0]}")
════════════════════════════════════════
`;
}

export function buildCampaignPrompt(
  input: BriefInput,
  userContext?: UserContext | null,
  pipelineContext?: PipelineContext
): string {
  const projectType = detectProjectType(input);
  const structuralLens = getStructuralLens(projectType);
  const variationDirective = getVariationDirective(input);
  const userContextBlock = buildUserContextBlock(userContext);
  const eventCategory = detectEventCategory(input);
  const eventPromptContext = buildEventPromptContext(briefToDetectOptions(input));
  const briefAnalysis = analyzeBrief(input);
  const briefAnalysisBlock = buildBriefAnalysisBlock(briefAnalysis);
  const winnerBlock = pipelineContext ? buildWinnerContextBlock(pipelineContext) : "";

  return `Tu es un consultant senior en communication interne et événementielle (15+ ans, cabinet McKinsey / BCG / EY). Tu travailles sur un mandat client réel. Ta réputation professionnelle est en jeu sur chaque livrable.

BRIEF CLIENT :
- Contexte entreprise : ${input.companyContext}
- Enjeu prioritaire : ${input.challenge}
- Cible interne : ${input.audience}
- Objectif : ${input.objective}
- Ton attendu : ${input.tone}
- Contraintes : ${input.constraints}
${userContextBlock}
${briefAnalysisBlock}

ANALYSE ÉVÉNEMENTIELLE PRÉ-CALCULÉE :
- Catégorie événementielle dominante : "${eventCategory}" (format grid)


TYPE DE PROJET DÉTECTÉ : ${projectType.toUpperCase()}
${structuralLens}
${winnerBlock}
${!pipelineContext ? variationDirective : ""}

========================================
MÉTHODE DE TRAVAIL OBLIGATOIRE
========================================

ÉTAPE 1 — LECTURE PROFONDE DU BRIEF
Avant d'écrire quoi que ce soit, extrais :
- Ce que le client dit (enjeu déclaré)
- Ce que le client ne dit pas (tensions sous-jacentes, non-dits organisationnels)
- Les risques d'échec implicites dans ce brief
- La culture implicite révélée par les mots choisis (ton, contraintes, audience)

ÉTAPE 2 — DIAGNOSTIC HONNÊTE
Formule :
- La vraie problématique de communication (pas l'enjeu déclaré — le vrai problème à résoudre)
- Les 2-3 freins principaux à l'adhésion dans CE contexte spécifique
- Le niveau de maturité communication de l'organisation (1-5 sur 3 axes : communication, engagement, readiness)

ÉTAPE 3 — CHOIX STRATÉGIQUE ASSUMÉ
- Choisis UN angle stratégique. Un seul. Assume-le.
- Explique pourquoi cet angle et pas les alternatives évidentes
- Cet angle doit être NON DUPLICABLE : un lecteur qui connaît 10 autres campagnes doit sentir la différence

ÉTAPE 4 — DISPOSITIF STRUCTURÉ
À partir de cet angle, construis un dispositif cohérent :
- Architecture temporelle adaptée au type de projet
- Séquencement logique (pas une liste d'actions)
- Chaque canal justifié par son rôle, pas par habitude

ÉTAPE 5 — SIMULATION DE RÉACTIONS
Simule comment réagiraient :
- Les managers (avant d'avoir le kit)
- Les collaborateurs (à la réception du premier message)
- Le terrain (à J+5, après les premières cascades)
Identifie le risque d'adhésion principal

ÉTAPE 6 — MODE CHALLENGE
Critique ton propre plan :
- Quelle est la principale faiblesse de la stratégie choisie ?
- Quels angles alternatifs ont été rejetés et pourquoi ?
- Qu'est-ce que le dispositif n'adresse PAS (angles morts) ?

ÉTAPE 7 — VUE DIRECTION (dircomView)
Synthèse décisionnelle pour le directeur de la communication ou le CODIR.
3 règles absolues : (1) pas de détails opérationnels, (2) chaque ligne doit appeler une décision ou une prise de position, (3) maximum 4 items par liste.
- summary : 2-3 phrases qui résument l'enjeu réel et la posture recommandée — ce qu'un CODIR doit entendre en 30 secondes
- keyRisks : les 2-4 risques stratégiques (pas opérationnels) qui peuvent faire échouer le dispositif
- keyArbitrations : les 2-4 choix déjà intégrés dans le plan que la direction doit assumer (les non-dits qui deviendront des problèmes si non assumés)
- decisionsToMake : les 2-4 décisions concrètes restantes qui appartiennent à la direction, pas à l'équipe communication

ÉTAPE 8 — COPILOTE ÉVÉNEMENTIEL (eventCopilot)

CONTEXTE STRATÉGIQUE PRÉ-ANALYSÉ (issu du moteur métier) :
${eventPromptContext}

Ta réponse sera soumise à un agent de validation qui vérifiera qu'elle respecte les règles métier.
Intègre ces règles correctement dès la première génération.

RÈGLES DE PRODUCTION :

════════════════════════════════════════
RÈGLE 1 — TOUJOURS PROPOSER (jamais refuser)
════════════════════════════════════════
Tu proposes TOUJOURS un mix priorisé de formats. Jamais de "événement non pertinent".
Pour un brief peu événementiel : propose des formats légers + dispositifs permanents.

════════════════════════════════════════
RÈGLE 2 — TAXONOMIE DE RÉFÉRENCE (8 catégories)
════════════════════════════════════════
- "sensibilisation-changement" : séminaires stratégiques, town halls, workshops de transformation, journées Open Door
- "mise-en-oeuvre" : lancement de process, ateliers d'alignement transversal, change labs, sessions accompagnement RH
- "nouvelle-organisation" : séminaires d'entreprise/business reviews, journées d'intégration, team-building organisationnel
- "onboarding" : journées d'accueil, buddy/sponsor events, e-learning + webinaires, drops de communication
- "communication-crise" : réunions de crise cadrées, FAQ/micro-site, webinaires de situation, tours de table managériaux
- "engagement-commercial" : kick-off, cas clients internes, sales challenges, repas de fraternisation
- "celebration-reconnaissance" : afterworks, soirées/galas, cérémonies de reconnaissance, moments informels
- "dispositifs-permanents" : intranet/micro-site, newsletter, réseau social d'entreprise, sondages, ambassadeurs, podcasts/vidéos

════════════════════════════════════════
RÈGLE 3 — PRIORISATION OBLIGATOIRE
════════════════════════════════════════
- primaryEventFormats : 1 à 2 formats SEULEMENT (les plus impactants pour CE brief)
- secondaryEventFormats : 2 à 3 compléments utiles
- permanentCommunicationDevices : 2 à 4 dispositifs durables
- Ne pas proposer une liste plate — prioriser, arbitrer, justifier

════════════════════════════════════════
RÈGLE 4 — STRUCTURE À PRODUIRE
════════════════════════════════════════
Chaque EventFormatRecommendation : category, format (nom précis), relevanceScore (1-5), whyRecommended (ancré dans le brief), expectedImpact, usageContext (quand/comment), implementationLevel ("léger"/"intermédiaire"/"structurant")

Champs textuels :
- strategicIntent : ce que le dispositif cherche à accomplir pour CE brief (2-3 phrases concrètes)
- recommendedMix : comment les formats s'articulent en dispositif cohérent
- whyTheseFormats : justification stratégique du mix, ancrée dans le brief
- eventRoleInStrategy : rôle précis dans la stratégie (pivot, amplificateur, signal symbolique, rite de passage...)
- beforePhase / duringPhase / afterPhase : concret, pas générique
- managerActivation : CE qu'ils font, disent, ne disent pas — pas "ils animent"
- participantExperience : une expérience, pas un programme
- eventStorytelling : tension dramatique → pivot → résolution → ce dont on se souvient
- watchouts : 2-4 risques spécifiques à CE brief
- formatsToAvoid : formats inadaptés à CE brief avec justification inline

════════════════════════════════════════
RÈGLE 5 — AUTO-VÉRIFICATION OBLIGATOIRE
════════════════════════════════════════
Avant de soumettre eventCopilot, vérifie :
✓ Ai-je bien identifié le type de projet événementiel ?
✓ Ai-je inclus TOUS les éléments obligatoires pour ce type ?
✓ Mes formats principaux sont-ils priorisés (1-2 max) ?
✓ Ma réponse est-elle ancrée dans CE brief ou est-elle réutilisable ailleurs ?
✓ Cette réponse serait-elle validée par un expert senior en événementiel ?
Si UNE réponse est non → corrige avant de soumettre.

INTERDITS :
- Dupliquer le contenu du dossier principal (timeline, messages, canaux)
- "communication-crise" en primaire sauf brief avec signaux de crise avérés
- "Créer du lien", "fédérer les équipes", "donner du sens" sans contenu concret
- Proposer un format sans l'ancrer dans le brief

POUR CHAQUE ITEM DE LA TIMELINE — ajouter obligatoirement :
- delay: "court terme" (J0 à J+7), "moyen terme" (J+8 à J+30), ou "long terme" (J+31 et au-delà)
- dependencies: liste des prérequis bloquants (ex: ["Validation DG", "Budget alloué", "Formation managers terminée"]) — tableau vide si aucun

========================================
RÈGLES ANTI-GÉNÉRIQUE (NON NÉGOCIABLES)
========================================

ANCRAGE OBLIGATOIRE : Chaque section doit contenir au moins 2 éléments directement issus du brief :
des chiffres, des rôles spécifiques, des délais contraints, ou des formulations issues du contexte.

ÉTAPE 9 — SINGULARITÉ (champ briefSpecificity)
Avant de finaliser, pose-toi cette question : "Cette recommandation pourrait-elle convenir à un autre brief très différent ?"
Si oui → retravaille l'angle stratégique jusqu'à ce que la réponse soit non.

Produis ensuite le champ briefSpecificity :
- whatMakesThisCaseUnique : 3-4 éléments concrets qui distinguent CE brief (chiffres, contexte, tensions, signaux repérés)
- whyThisRecommendationFits : 2-3 phrases expliquant pourquoi CET angle et pas un autre pour CE brief précis
- whatWasDeliberatelyExcluded : 2-3 approches ou formats qui ont été envisagés mais écartés, avec justification inline

TEST FINAL OBLIGATOIRE avant de soumettre :
→ L'angle stratégique serait-il identique pour une autre entreprise du même secteur ? Si oui : reformuler.
→ Les messages pourraient-ils être signés par n'importe quelle direction d'entreprise ? Si oui : personnaliser.
→ Le plan tient-il compte des contraintes opérationnelles mentionnées ? Si non : ajuster.
→ La simulation de réactions est-elle réaliste ou bienveillante ? Privilégier le réalisme.
→ Les signaux distinctifs identifiés dans l'ANALYSE STRUCTURÉE DU BRIEF apparaissent-ils dans au moins une section ? Si non : les intégrer.
→ Le champ briefSpecificity décrit-il réellement CE brief ou pourrait-il s'appliquer à tout autre projet ? Si générique : refaire.

INTERDITS ABSOLUS :
- "Il est essentiel de", "dans un contexte changeant", "mobiliser les équipes", "créer de l'engagement"
- KPIs sans chiffre cible et sans date
- Messages interchangeables d'une audience à l'autre
- Scénarios dont les différences sont cosmétiques (niveau d'ambition, pas de liste)
- Critique dans challengeMode qui se termine par "mais c'est quand même la bonne approche"

Retourne uniquement un JSON valide respectant exactement le schéma fourni. Aucun texte avant ou après.`;
}

// Backward-compatible aliases
export function buildStrategyPrompt(input: BriefInput): string {
  return buildCampaignPrompt(input);
}


export function buildEditorialPrompt(_input: BriefInput): string {
  return "";
}
