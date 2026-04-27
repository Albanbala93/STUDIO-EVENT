/**
 * Couche mémoire stratégique de Stratly.
 *
 * Capture une signature compacte de chaque projet généré (ProjectAnalysis)
 * pour permettre, sans recharger les payloads complets :
 *   - l'historique par client                → getProjectHistory(clientKey)
 *   - la comparaison des N derniers projets  → compareLastProjects(n)
 *   - les tendances dérivées                  → computeTrends()
 *   - les insights narratifs                  → computeInsights()
 *
 * Aucune dépendance externe, aucun appel LLM. 100 % dérivé des données
 * locales — donc gratuit en latence et en coût, et exécutable côté UI.
 *
 * Stockage : localStorage (clé STORAGE_KEY), capé à MAX_ANALYSES pour
 * éviter une croissance non bornée.
 */

import type {
  ProjectAnalysis,
  ProjectComparison,
  ProjectInsight,
  ProjectTrends,
  ProjectType,
  StudioProject,
  Distribution,
} from "./types";

const STORAGE_KEY = "stratly_project_memory";
const DEFAULT_CLIENT = "default";
const MAX_ANALYSES = 200;
const TREND_WINDOW_DAYS = 90;

/* ============================================================
   I/O — localStorage
============================================================ */

function readAll(): ProjectAnalysis[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ProjectAnalysis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ProjectAnalysis[]): void {
  if (typeof window === "undefined") return;
  const trimmed = items
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
    .slice(0, MAX_ANALYSES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/* ============================================================
   Extraction — StudioProject → ProjectAnalysis
============================================================ */

function audiencesCovered(project: StudioProject): number {
  return project.output.audienceMessages?.length ?? 0;
}

function eventFormatsCount(project: StudioProject): number {
  const ec = project.output.eventCopilot;
  if (!ec) return 0;
  return (
    (ec.primaryEventFormats?.length ?? 0) +
    (ec.secondaryEventFormats?.length ?? 0)
  );
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) : s;
}

function buildAnalysis(
  project: StudioProject,
  clientKey: string,
): ProjectAnalysis {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    projectId: project.id,
    clientKey,
    recordedAt: new Date().toISOString(),

    title: project.title,
    projectType: project.output.projectType,
    audience: project.brief.audience,
    tone: project.brief.tone,
    dominantRegister: project.output.pipelineDebug?.briefAnalysis?.dominantRegister,
    primaryObjective:
      project.output.pipelineDebug?.briefAnalysis?.primaryObjective ??
      project.brief.objective,

    signals: {
      keyMessages: project.output.keyMessages?.length ?? 0,
      timelineSteps: project.output.timeline?.length ?? 0,
      eventFormats: eventFormatsCount(project),
      risksFlagged: project.output.risks?.length ?? 0,
      audiencesCovered: audiencesCovered(project),
      hasEventCopilot: !!project.output.eventCopilot,
      hasDircomView: !!project.output.dircomView,
    },

    briefHash: {
      challenge: truncate(project.brief.challenge, 80),
      constraints: truncate(project.brief.constraints, 80),
    },
  };
}

/* ============================================================
   Public API — record + retrieve
============================================================ */

/**
 * Persiste une analyse dérivée du projet. Idempotent par projectId :
 * deux enregistrements consécutifs pour le même projet remplacent le
 * précédent (cas d'une régénération).
 */
export function recordAnalysis(
  project: StudioProject,
  clientKey: string = DEFAULT_CLIENT,
): ProjectAnalysis {
  const analysis = buildAnalysis(project, clientKey);
  const existing = readAll().filter(
    (a) => !(a.projectId === project.id && a.clientKey === clientKey),
  );
  writeAll([analysis, ...existing]);
  return analysis;
}

/**
 * Historique d'analyses pour un client donné, du plus récent au plus
 * ancien. clientKey omis = workspace par défaut.
 */
export function getProjectHistory(
  clientKey: string = DEFAULT_CLIENT,
): ProjectAnalysis[] {
  return readAll()
    .filter((a) => a.clientKey === clientKey)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

/* ============================================================
   Comparison — N last projects
============================================================ */

function distinct<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function intersection<T>(arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[]>((acc, cur, i) =>
    i === 0 ? distinct(cur) : acc.filter((v) => cur.includes(v)),
    [],
  );
}

export function compareLastProjects(
  n: number,
  clientKey: string = DEFAULT_CLIENT,
): ProjectComparison {
  const analyses = getProjectHistory(clientKey).slice(0, Math.max(1, n));
  const count = analyses.length;

  if (count === 0) {
    return {
      count: 0,
      analyses: [],
      shared: { projectTypes: [], audiences: [], tones: [] },
      averageSignals: {
        keyMessages: 0,
        timelineSteps: 0,
        risks: 0,
        eventFormats: 0,
      },
      observation: "Aucune analyse en mémoire pour ce workspace.",
    };
  }

  const sharedTypes = intersection(
    analyses.map((a) => (a.projectType ? [a.projectType] : [])),
  ) as ProjectType[];
  const sharedAudiences = intersection(analyses.map((a) => [a.audience].filter(Boolean)));
  const sharedTones = intersection(analyses.map((a) => [a.tone].filter(Boolean)));

  const avg = (key: keyof ProjectAnalysis["signals"]): number => {
    const total = analyses.reduce((sum, a) => sum + (a.signals[key] as number), 0);
    return Math.round((total / count) * 10) / 10;
  };

  const observation = buildComparisonObservation(
    count,
    sharedTypes,
    sharedAudiences,
    sharedTones,
  );

  return {
    count,
    analyses,
    shared: {
      projectTypes: sharedTypes,
      audiences: sharedAudiences,
      tones: sharedTones,
    },
    averageSignals: {
      keyMessages: avg("keyMessages"),
      timelineSteps: avg("timelineSteps"),
      risks: avg("risksFlagged"),
      eventFormats: avg("eventFormats"),
    },
    observation,
  };
}

function buildComparisonObservation(
  count: number,
  types: ProjectType[],
  audiences: string[],
  tones: string[],
): string {
  if (count === 1) {
    return "Une seule analyse en mémoire — la comparaison s'enrichira au fil des projets.";
  }
  const parts: string[] = [];
  if (types.length === 1) parts.push(`type ${types[0]}`);
  if (audiences.length === 1) parts.push(`même audience (${audiences[0]})`);
  if (tones.length === 1) parts.push(`tonalité ${tones[0]}`);
  if (parts.length === 0) {
    return `${count} projets aux signatures distinctes — peu de récurrence détectée.`;
  }
  return `${count} projets partagent : ${parts.join(", ")}.`;
}

/* ============================================================
   Trends — dérivation pure
============================================================ */

function topDistribution<T extends string>(
  values: (T | undefined)[],
): Distribution<T> | undefined {
  const counts = new Map<T, number>();
  let total = 0;
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return undefined;
  let top: { value: T; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!top || count > top.count) top = { value, count };
  }
  if (!top) return undefined;
  return { value: top.value, count: top.count, share: top.count / total };
}

function daysBetween(later: string, earlier: string): number {
  return (new Date(later).getTime() - new Date(earlier).getTime()) / (1000 * 60 * 60 * 24);
}

export function computeTrends(
  clientKey: string = DEFAULT_CLIENT,
  windowDays: number = TREND_WINDOW_DAYS,
): ProjectTrends {
  const all = getProjectHistory(clientKey);
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const recent = all.filter((a) => a.recordedAt >= cutoff);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const lastWeek = all.filter((a) => a.recordedAt >= oneWeekAgo).length;
  const previousWeek = all.filter(
    (a) => a.recordedAt >= twoWeeksAgo && a.recordedAt < oneWeekAgo,
  ).length;
  const deltaPct =
    previousWeek === 0
      ? lastWeek > 0
        ? 100
        : 0
      : Math.round(((lastWeek - previousWeek) / previousWeek) * 100);

  const total = recent.length;
  const sumNum = (key: keyof ProjectAnalysis["signals"]): number =>
    recent.reduce((s, a) => s + (a.signals[key] as number), 0);

  const eventCopilotCount = recent.filter((a) => a.signals.hasEventCopilot).length;

  return {
    totalAnalyses: total,
    windowDays,
    dominantProjectType: topDistribution<ProjectType>(recent.map((a) => a.projectType)),
    dominantAudience: topDistribution<string>(recent.map((a) => a.audience)),
    dominantTone: topDistribution<string>(recent.map((a) => a.tone)),
    velocity: { lastWeek, previousWeek, deltaPct },
    averageTimelineSteps: total === 0 ? 0 : Math.round((sumNum("timelineSteps") / total) * 10) / 10,
    averageRisks: total === 0 ? 0 : Math.round((sumNum("risksFlagged") / total) * 10) / 10,
    averageKeyMessages: total === 0 ? 0 : Math.round((sumNum("keyMessages") / total) * 10) / 10,
    eventCopilotAdoption: {
      count: eventCopilotCount,
      share: total === 0 ? 0 : eventCopilotCount / total,
    },
  };
}

/* ============================================================
   Insights — narratifs courts dérivés des trends + history
============================================================ */

function newInsight(
  kind: ProjectInsight["kind"],
  severity: ProjectInsight["severity"],
  title: string,
  description: string,
): ProjectInsight {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, kind, severity, title, description };
}

export function computeInsights(
  clientKey: string = DEFAULT_CLIENT,
): ProjectInsight[] {
  const history = getProjectHistory(clientKey);
  if (history.length === 0) return [];

  const trends = computeTrends(clientKey);
  const insights: ProjectInsight[] = [];

  // Frequency insight
  if (trends.dominantProjectType && trends.dominantProjectType.share >= 0.5) {
    const d = trends.dominantProjectType;
    insights.push(
      newInsight(
        "frequency",
        "highlight",
        `${Math.round(d.share * 100)}% des projets sont de type ${d.value}`,
        `${d.count} projet${d.count > 1 ? "s" : ""} sur les ${trends.totalAnalyses} derniers — tendance dominante de l'activité Stratly.`,
      ),
    );
  }

  // Pattern insight — tone
  if (trends.dominantTone && trends.dominantTone.share >= 0.6) {
    const d = trends.dominantTone;
    insights.push(
      newInsight(
        "pattern",
        "info",
        `Tonalité récurrente : ${d.value}`,
        `Présente dans ${Math.round(d.share * 100)}% des briefs récents — vérifiez qu'elle reste alignée avec chaque cible.`,
      ),
    );
  }

  // Shift insight — velocity
  if (Math.abs(trends.velocity.deltaPct) >= 50 && trends.velocity.lastWeek + trends.velocity.previousWeek >= 3) {
    const up = trends.velocity.deltaPct > 0;
    insights.push(
      newInsight(
        "shift",
        up ? "highlight" : "warning",
        up
          ? `Activité en accélération (+${trends.velocity.deltaPct}% sur 7j)`
          : `Activité en ralentissement (${trends.velocity.deltaPct}% sur 7j)`,
        `${trends.velocity.lastWeek} projets cette semaine vs. ${trends.velocity.previousWeek} la précédente.`,
      ),
    );
  }

  // Gap insight — event copilot underused
  if (
    trends.totalAnalyses >= 3 &&
    trends.eventCopilotAdoption.share < 0.2
  ) {
    insights.push(
      newInsight(
        "gap",
        "warning",
        "Copilote événement peu mobilisé",
        `Activé sur seulement ${trends.eventCopilotAdoption.count} des ${trends.totalAnalyses} derniers projets — un levier d'engagement potentiellement sous-exploité.`,
      ),
    );
  }

  // Pattern insight — audience repetition
  if (trends.dominantAudience && trends.dominantAudience.share >= 0.7) {
    const d = trends.dominantAudience;
    insights.push(
      newInsight(
        "pattern",
        "info",
        `Cible récurrente : ${d.value}`,
        `${Math.round(d.share * 100)}% des dispositifs visent cette audience — pensez à varier pour couvrir d'autres parties prenantes.`,
      ),
    );
  }

  return insights;
}

/* ============================================================
   Maintenance
============================================================ */

/** Vide la mémoire stratégique pour un client (utile en réglages). */
export function clearMemory(clientKey: string = DEFAULT_CLIENT): void {
  const remaining = readAll().filter((a) => a.clientKey !== clientKey);
  writeAll(remaining);
}
