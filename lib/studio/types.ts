export type ProjectStatus = "draft" | "generated" | "approved";

export type ProjectType =
  | "transformation"
  | "crise"
  | "rh-social"
  | "corporate"
  | "deploiement-outil"
  | "change-culturel"
  | "reorganisation"
  | "performance";

export type BriefInput = {
  companyContext: string;
  challenge: string;
  audience: string;
  objective: string;
  tone: string;
  constraints: string;
};

export type TimelineItem = {
  when: string;
  action: string;
  impact?: "élevé" | "moyen" | "faible";
  complexity?: "élevé" | "moyen" | "faible";
  delay?: "court terme" | "moyen terme" | "long terme";
  dependencies?: string[];
};

export type RelayItem = {
  role: string;
  mission: string;
};

export type AudienceMessage = {
  audience: string;
  message: string;
  channel: string;
};

export type KpiItem = {
  indicator: string;
  target: string;
  timing: string;
};

export type RiskItem = {
  risk: string;
  level: "élevé" | "moyen" | "faible";
  mitigation: string;
};

export type ScenarioItem = {
  name: "Essentiel" | "Renforcé" | "Signature";
  description: string;
  actions: string[];
};

export type MaturityScores = {
  communication: number;   // 1–5
  engagement: number;      // 1–5
  changeReadiness: number; // 1–5
  label: string;           // diagnostic sentence
};

export type ReactionSimulation = {
  managers: string;
  collaborators: string;
  terrain: string;
  mainRisk: string;
};

export type ChallengeMode = {
  critique: string;
  blindSpots: string[];
  alternatives: string[];
};

/**
 * Vue Direction — synthèse décisionnelle pour le DirCom / CODIR.
 * Aucun détail opérationnel : uniquement ce sur quoi il faut trancher.
 */
export type DircomView = {
  summary: string;           // 3 phrases max, orienté résultat attendu
  keyRisks: string[];        // risques stratégiques (pas opérationnels)
  keyArbitrations: string[]; // arbitrages déjà faits dans le plan
  decisionsToMake: string[]; // décisions qui restent à prendre par la direction
};

/**
 * Contexte utilisateur — mémorisé entre les sessions pour personnaliser la génération.
 */
export type UserContext = {
  sector?: string;
  frequentProjectTypes?: string[];
  preferredTone?: string;
  recentTopics?: string[];
  updatedAt?: string;
};

/* ============================================================
   MULTI-STEP GENERATION PIPELINE
   Steps: brief analysis → scenario generation → scoring →
          shortlist → winner selection → final generation
============================================================ */

/**
 * PIPELINE STEP 1 — Semantic brief analysis (LLM-generated).
 * Richer than the code-based BriefAnalysis — includes collective
 * and symbolic needs that require semantic understanding.
 */
export type BriefAnalysisResult = {
  projectType: string;
  dominantRegister: string;
  primaryObjective: string;
  emotionalIntent: string;
  /** What the group needs to experience together */
  collectiveNeed: string;
  /** The missing or expected symbolic gesture in this context */
  symbolicNeed: string;
  mainConstraints: string[];
  distinctiveSignals: string[];
};

/**
 * PIPELINE STEP 2 — One candidate scenario (short).
 * Each scenario is a distinct strategic option, not a variation.
 */
export type ScenarioCandidate = {
  title: string;
  mainFormat: string;
  rationale: string;
  registerFit: string;
  expectedImpact: string;
  potentialRisks: string;
};

/**
 * PIPELINE STEP 3 — Evaluation scores for one scenario.
 * Each dimension 0–10, penalty 0 to -5.
 */
export type ScenarioScore = {
  registerAdequacy: number;        // 0–10
  objectiveAdequacy: number;       // 0–10
  emotionalAdequacy: number;       // 0–10
  collectiveNeedAdequacy: number;  // 0–10
  constraintCoherence: number;     // 0–10
  discouragedFormatPenalty: number;// 0 to -5 (negative)
  total: number;                   // sum of all (max 50)
};

/** A ScenarioCandidate enriched with scores and rank from step 3. */
export type ScoredScenario = ScenarioCandidate & {
  scores: ScenarioScore;
  rank: number; // 1 = best
};

/**
 * PIPELINE STEP 4–5 — Shortlist and winner selection.
 * Contains the shortlisted scenarios, the elected winner,
 * and the expert reasoning behind each decision.
 */
export type ScenarioSelectionResult = {
  shortlist: ScoredScenario[];      // top 3–4 scored scenarios
  winner: ScoredScenario;
  whyWinner: string;                // 2–3 sentences anchored in the brief
  whyOthersSecondary: string[];     // one sentence per non-winner shortlist item
  whyAvoided: string[];             // grouped reasons for non-shortlisted items
};

/**
 * Full pipeline debug payload — attached to the API response
 * when debug mode is on (not stored in localStorage).
 */
export type PipelineDebugInfo = {
  briefAnalysis: BriefAnalysisResult;
  generatedScenarios: ScenarioCandidate[];
  scenarioSelection: ScenarioSelectionResult;
};

/**
 * Structured analysis layer extracted from the brief before generation.
 * Used to inject specific signals into the prompt for non-duplicable recommendations.
 */
export type BriefAnalysis = {
  projectType: string;
  primaryObjective: string;
  secondaryObjectives: string[];
  dominantAudience: string;
  dominantRegister: string;
  emotionalIntent: string;
  mainConstraint: string;
  successDefinition: string;
  /** Concrete signals extracted from brief text: numbers, tools, scope, urgency, context */
  distinctiveSignals: string[];
};

/**
 * Explicit specificity block — explains what makes THIS recommendation unique
 * and what was deliberately excluded. Displayed in the output UI.
 */
export type BriefSpecificity = {
  /** What makes this case distinct from a generic recommendation */
  whatMakesThisCaseUnique: string[];
  /** Why this specific recommendation fits THIS brief — not another */
  whyThisRecommendationFits: string;
  /** Formats/angles that were considered and deliberately excluded — with reasoning */
  whatWasDeliberatelyExcluded: string[];
};

export type StudioOutput = {
  // Classification
  projectType?: ProjectType;

  // Strategic analysis
  executiveSummary: string;
  communicationDiagnostic: string;
  centralProblem: string;
  strategicAngle: string;

  // Device architecture
  deviceArchitecture: string;
  audienceMessages: AudienceMessage[];
  channelMix: string[];

  // Content pillars
  keyMessages: string[];

  // Deployment
  timeline: TimelineItem[];
  recommendedFormats: string[];
  relays: RelayItem[];

  // Governance & risk
  kpis: KpiItem[];
  risks: RiskItem[];
  quickWins: string[];
  governance: string;

  // Ready-to-deploy content
  generatedContent: {
    executiveEmail: string;
    intranetPost: string;
    managerKit: string;
    faq: string;
  };

  // Alternative scenarios
  scenarios: ScenarioItem[];

  // Personalization layer (optional — new generations only)
  briefSpecificity?: BriefSpecificity;

  // Pipeline reasoning transparency (optional — present when pipeline was used)
  pipelineDebug?: PipelineDebugInfo;

  // Premium intelligence layers (optional — new generations only)
  maturityScores?: MaturityScores;
  reactionSimulation?: ReactionSimulation;
  challengeMode?: ChallengeMode;
  dircomView?: DircomView;

  // Event copilot (optional — only when brief implies an event)
  eventCopilot?: EventCopilot;
};

/* ============================================================
   EVENT COPILOT v2
   Always produces a prioritised mix of event formats.
   Never a binary yes/no — always actionable recommendations.
   Validated by a post-generation correction agent.
============================================================ */

export type ImplementationLevel = "léger" | "intermédiaire" | "structurant";

export type EventCategory =
  | "sensibilisation-changement"
  | "mise-en-oeuvre"
  | "nouvelle-organisation"
  | "onboarding"
  | "communication-crise"
  | "engagement-commercial"
  | "celebration-reconnaissance"
  | "dispositifs-permanents";

export type EventFormatRecommendation = {
  category: EventCategory;
  format: string;
  /** Relevance score 1–5 relative to this specific brief */
  relevanceScore: number;
  /** Why this format is recommended for THIS brief specifically */
  whyRecommended: string;
  /** Expected result / impact */
  expectedImpact: string;
  /** When and how to deploy this format */
  usageContext: string;
  implementationLevel: ImplementationLevel;
};

export type EventCopilot = {
  /** What the event layer is trying to achieve for this specific brief */
  strategicIntent: string;
  /** 1–2 formats that deliver the highest value for this brief */
  primaryEventFormats: EventFormatRecommendation[];
  /** 2–3 useful complements to the primary format(s) */
  secondaryEventFormats: EventFormatRecommendation[];
  /** Permanent devices that sustain engagement beyond punctual events */
  permanentCommunicationDevices: EventFormatRecommendation[];
  /** How the formats work together as a coherent mix */
  recommendedMix: string;
  /** Strategic justification: why this specific mix for this specific brief */
  whyTheseFormats: string;
  /** Role of the event layer in the overall communication strategy */
  eventRoleInStrategy: string;
  /** Before phase: preparation actions */
  beforePhase: string;
  /** During phase: key moments and animation */
  duringPhase: string;
  /** After phase: relay and anchoring actions */
  afterPhase: string;
  /** Concrete role of managers in the event layer */
  managerActivation: string;
  /** What participants actually experience */
  participantExperience: string;
  /** Narrative thread running through the event(s) */
  eventStorytelling: string;
  /** Risks and watchpoints specific to this brief */
  watchouts: string[];
  /** Formats explicitly not recommended for this brief, with brief justification */
  formatsToAvoid: string[];
};

/* ============================================================
   COLLABORATION LAYER
   Stored alongside StudioProject, fully optional for backward compat.
============================================================ */

/** Validation status of a specific section of the document. */
export type SectionStatus = "draft" | "in_review" | "approved" | "needs_changes";

export const SECTION_STATUS_LABELS: Record<SectionStatus, string> = {
  draft: "Brouillon",
  in_review: "En révision",
  approved: "Validé",
  needs_changes: "À retravailler",
};

/** Metadata attached to a named section. */
export type SectionMeta = {
  status: SectionStatus;
  ownerName?: string;  // free-text, no user management needed
  updatedAt?: string;
};

/** A comment thread item on a named section. */
export type ProjectComment = {
  id: string;
  sectionId: string;
  authorName: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
};

/** One entry in the project activity log. */
export type ProjectActivityItem = {
  id: string;
  type: "edit" | "comment" | "status_change" | "assignment";
  message: string;
  createdAt: string;
  authorName?: string;
};

/** The full collaboration payload attached to a project. */
export type ProjectCollaboration = {
  sectionMeta: Record<string, SectionMeta>;   // key = sectionId
  comments: ProjectComment[];
  activity: ProjectActivityItem[];
  isShared?: boolean;
  shareToken?: string;
  shareMode?: "view" | "edit";
};

export type StudioProject = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  brief: BriefInput;
  output: StudioOutput;
  collaboration?: ProjectCollaboration;        // optional — new field
};

/* ============================================================
   STRATEGIC MEMORY LAYER
   Lightweight project signature stored after each generation.
   Enables history, comparison, trends and insights — without
   re-reading the full project payload on every aggregation.
============================================================ */

/**
 * Compact, comparable signature of a generated project.
 * Stored separately from StudioProject so the analysis layer
 * stays cheap even with many projects in localStorage.
 */
export type ProjectAnalysis = {
  id: string;             // analysis id (uuid)
  projectId: string;      // → StudioProject.id
  clientKey: string;      // workspace key — "default" until auth lands
  recordedAt: string;     // ISO

  // Core signature
  title: string;
  projectType?: ProjectType;
  audience: string;
  tone: string;
  dominantRegister?: string;
  primaryObjective?: string;

  // Structural fingerprint (cheap, directly comparable)
  signals: {
    keyMessages: number;
    timelineSteps: number;
    eventFormats: number;       // primary + secondary
    risksFlagged: number;
    audiencesCovered: number;
    hasEventCopilot: boolean;
    hasDircomView: boolean;
  };

  // Topical fingerprint (truncated to keep storage light)
  briefHash: {
    challenge: string;          // ≤ 80 chars
    constraints: string;        // ≤ 80 chars
  };
};

/** Distribution row used to surface dominant values across history. */
export type Distribution<T = string> = {
  value: T;
  count: number;
  share: number;            // 0..1
};

/** UI-ready trends panel. All fields are derived (no LLM call). */
export type ProjectTrends = {
  totalAnalyses: number;
  windowDays: number;
  dominantProjectType?: Distribution<ProjectType>;
  dominantAudience?: Distribution;
  dominantTone?: Distribution;
  velocity: { lastWeek: number; previousWeek: number; deltaPct: number };
  averageTimelineSteps: number;
  averageRisks: number;
  averageKeyMessages: number;
  eventCopilotAdoption: { count: number; share: number };
};

export type InsightKind = "frequency" | "pattern" | "shift" | "gap";

/** Short narrative observation derived from trends. UI-ready. */
export type ProjectInsight = {
  id: string;
  kind: InsightKind;
  title: string;            // 1 line
  description: string;      // 1–2 lines
  severity: "info" | "highlight" | "warning";
};

/** Comparative snapshot across the last N analyses. */
export type ProjectComparison = {
  count: number;
  analyses: ProjectAnalysis[];
  shared: {
    projectTypes: ProjectType[];
    audiences: string[];
    tones: string[];
  };
  averageSignals: {
    keyMessages: number;
    timelineSteps: number;
    risks: number;
    eventFormats: number;
  };
  observation: string;      // single sentence summary, ready to display
};
