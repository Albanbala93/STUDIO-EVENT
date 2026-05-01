type FoundationStatus =
  | "validated"
  | "user_entered"
  | "inherited"
  | "suggested"
  | "empty";
import type { StudioProject } from "../studio/types";

export type ModuleName = "campaign" | "pilot" | "impact";
export type EnrichmentSource = "validated" | "user_entered" | "inherited" | "suggested";
export type EnrichmentFamily =
  | "objectives"
  | "audiences"
  | "keyMessages"
  | "risks"
  | "constraints"
  | "kpis"
  | "surveyQuestions"
  | "recommendations"
  | "impactTopics"
  | "comexInsights"
  | "rseRisks"
  | "actionPlan"
  | "measurementPlan"
  | "expectedBehaviorChanges"
  | "momentsToMeasure";

export type EnrichmentItem = {
  id: string;
  family: EnrichmentFamily;
  key: string;
  value: unknown;
  source: EnrichmentSource;
  sourceModule?: ModuleName;
  confidence?: number;
  updatedAt?: string;
  validatedByUser?: boolean;
};

export type EnrichedModuleInput = {
  projectId: string;
  targetModule: ModuleName;
  baseBrief: string;
  sharedFoundation?: unknown;
  moduleOutputs: { campaign?: unknown; pilot?: unknown; impact?: unknown };
  availableEnrichments: EnrichmentItem[];
  selectedEnrichments: EnrichmentItem[];
  missingFamilies: string[];
  sourceSummary: Record<EnrichmentSource, number>;
  warnings: string[];
};

const PRIORITY: Record<EnrichmentSource, number> = {
  validated: 4,
  user_entered: 3,
  inherited: 2,
  suggested: 1,
};

const TARGET_FAMILIES: Record<ModuleName, EnrichmentFamily[]> = {
  campaign: ["objectives", "audiences", "constraints", "recommendations", "comexInsights", "impactTopics", "risks"],
  pilot: ["objectives", "audiences", "keyMessages", "risks", "kpis", "surveyQuestions", "measurementPlan", "actionPlan", "expectedBehaviorChanges", "momentsToMeasure"],
  impact: ["objectives", "audiences", "risks", "constraints", "impactTopics", "comexInsights", "recommendations", "rseRisks", "actionPlan"],
};

function toItem(family: EnrichmentFamily, key: string, value: unknown, source: EnrichmentSource, sourceModule?: ModuleName, updatedAt?: string): EnrichmentItem {
  return { id: `${sourceModule ?? "foundation"}:${family}:${key}`, family, key, value, source, sourceModule, updatedAt };
}

function mapFoundationStatus(status: FoundationStatus | string): EnrichmentSource {
  if (status === "validated") return "validated";
  if (status === "user_entered") return "user_entered";
  if (status === "inherited") return "inherited";
  return "suggested";
}

export function buildEnrichedModuleInput(project: StudioProject, targetModule: ModuleName): EnrichedModuleInput {
  const projectAny = project as any;
  const available: EnrichmentItem[] = [];
  const warnings: string[] = [];
  const campaign = projectAny.modules?.campaign?.output as any;
  const pilot = projectAny.modules?.pilot?.output as any;
  const impact = projectAny.modules?.impact?.output as any;

  const hints = campaign?.measurementHints;
  hints?.communicationObjectives?.forEach((v: string, i: number) => available.push(toItem("objectives", `campaign-objective-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));
  hints?.targetAudiences?.forEach((v: string, i: number) => available.push(toItem("audiences", `campaign-audience-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));
  hints?.expectedBehaviorChanges?.forEach((v: string, i: number) => available.push(toItem("expectedBehaviorChanges", `campaign-behavior-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));
  hints?.keyMessagesToValidate?.forEach((v: string, i: number) => available.push(toItem("keyMessages", `campaign-message-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));
  hints?.risksToMonitor?.forEach((v: string, i: number) => available.push(toItem("risks", `campaign-risk-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));
  hints?.momentsToMeasure?.forEach((v: string, i: number) => available.push(toItem("momentsToMeasure", `campaign-moment-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));
  hints?.suggestedKpis?.forEach((v: any, i: number) => available.push(toItem("kpis", `campaign-kpi-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));
  hints?.suggestedSurveyQuestions?.forEach((v: any, i: number) => available.push(toItem("surveyQuestions", `campaign-question-${i}`, v, "suggested", "campaign", projectAny.modules?.campaign?.updatedAt)));

  pilot?.kpis?.forEach((v: any, i: number) => available.push(toItem("kpis", `pilot-kpi-${i}`, v, "validated", "pilot", projectAny.modules?.pilot?.updatedAt)));
  pilot?.barometerQuestions?.forEach((v: string, i: number) => available.push(toItem("surveyQuestions", `pilot-question-${i}`, v, "validated", "pilot", projectAny.modules?.pilot?.updatedAt)));
  pilot?.weakSignals?.forEach((v: string, i: number) => available.push(toItem("risks", `pilot-risk-${i}`, v, "inherited", "pilot", projectAny.modules?.pilot?.updatedAt)));
  pilot?.steeringRecommendations?.forEach((v: string, i: number) => available.push(toItem("recommendations", `pilot-rec-${i}`, v, "validated", "pilot", projectAny.modules?.pilot?.updatedAt)));
  if (pilot?.measurementPlan) available.push(toItem("measurementPlan", "pilot-measurement-plan", pilot.measurementPlan, "validated", "pilot", projectAny.modules?.pilot?.updatedAt));
  if (pilot?.actionPlan) available.push(toItem("actionPlan", "pilot-action-plan", pilot.actionPlan, "validated", "pilot", projectAny.modules?.pilot?.updatedAt));

  impact?.comexInsights?.forEach((v, i) => available.push(toItem("comexInsights", `impact-comex-${i}`, v, "validated", "impact", projectAny.modules?.impact?.updatedAt)));
  impact?.impactTopics?.forEach((v, i) => available.push(toItem("impactTopics", `impact-topic-${i}`, v, "validated", "impact", projectAny.modules?.impact?.updatedAt)));
  impact?.rseRisks?.forEach((v, i) => available.push(toItem("rseRisks", `impact-rse-risk-${i}`, v, "validated", "impact", projectAny.modules?.impact?.updatedAt)));
  impact?.strategicRisks?.forEach((v, i) => available.push(toItem("risks", `impact-strategic-risk-${i}`, v, "validated", "impact", projectAny.modules?.impact?.updatedAt)));
  impact?.recommendations?.forEach((v, i) => available.push(toItem("recommendations", `impact-rec-${i}`, v, "validated", "impact", projectAny.modules?.impact?.updatedAt)));
  impact?.nextActions?.forEach((v, i) => available.push(toItem("actionPlan", `impact-action-${i}`, v, "validated", "impact", projectAny.modules?.impact?.updatedAt)));

  const foundation = projectAny.sharedFoundation?.data;
  if (foundation) {
    available.push(toItem("objectives", "foundation-objective", foundation.objective.value, mapFoundationStatus(foundation.objective.status)));
    foundation.audiences.value.forEach((v, i) => available.push(toItem("audiences", `foundation-audience-${i}`, v, mapFoundationStatus(foundation.audiences.status))));
    foundation.constraints.value.forEach((v, i) => available.push(toItem("constraints", `foundation-constraint-${i}`, v, mapFoundationStatus(foundation.constraints.status))));
    foundation.risks.value.forEach((v, i) => available.push(toItem("risks", `foundation-risk-${i}`, v, mapFoundationStatus(foundation.risks.status))));
    foundation.recommendations.value.forEach((v, i) => available.push(toItem("recommendations", `foundation-rec-${i}`, v, mapFoundationStatus(foundation.recommendations.status))));
    foundation.kpis.value.forEach((v, i) => available.push(toItem("kpis", `foundation-kpi-${i}`, v, mapFoundationStatus(foundation.kpis.status))));
  }

  const usefulFamilies = TARGET_FAMILIES[targetModule];
  const bucket = new Map<string, EnrichmentItem>();
  for (const item of available.filter((x) => usefulFamilies.includes(x.family))) {
    const key = `${item.family}:${item.key}`;
    const existing = bucket.get(key);
    if (!existing || PRIORITY[item.source] > PRIORITY[existing.source]) bucket.set(key, item);
  }
  const selected = Array.from(bucket.values());
  const sourceSummary: Record<EnrichmentSource, number> = { validated: 0, user_entered: 0, inherited: 0, suggested: 0 };
  selected.forEach((i) => sourceSummary[i.source]++);
  const missingFamilies = usefulFamilies.filter((f) => !selected.some((i) => i.family === f));
  if (missingFamilies.length) warnings.push(`Missing enrichment families: ${missingFamilies.join(", ")}`);

  if (process.env.NODE_ENV !== "production") {
    console.info("[STRATLY_ENRICHMENT_ENGINE]");
    console.info(`projectId=${project.id}`);
    console.info(`targetModule=${targetModule}`);
    console.info(`availableEnrichments=${available.length}`);
    console.info(`selectedEnrichments=${selected.length}`);
    console.info(`validatedCount=${sourceSummary.validated}`);
    console.info(`userEnteredCount=${sourceSummary.user_entered}`);
    console.info(`inheritedCount=${sourceSummary.inherited}`);
    console.info(`suggestedCount=${sourceSummary.suggested}`);
    console.info(`missingFamilies=${missingFamilies.join(",")}`);
  }

  return {
    projectId: project.id,
    targetModule,
    baseBrief: `${projectAny.brief.companyContext}\n${projectAny.brief.challenge}\n${projectAny.brief.objective}`,
    sharedFoundation: projectAny.sharedFoundation,
    moduleOutputs: { campaign, pilot, impact },
    availableEnrichments: available,
    selectedEnrichments: selected,
    missingFamilies,
    sourceSummary,
    warnings,
  };
}
