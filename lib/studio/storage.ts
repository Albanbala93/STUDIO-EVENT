import type {
  ProjectActivityItem,
  ProjectCollaboration,
  ProjectComment,
  SectionMeta,
  SectionStatus,
  StudioProject,
  UserContext,
} from "./types";
import { recordAnalysis } from "./memory";
import { detectAndApplyStaleness } from "../modules/staleness";

const STORAGE_KEY = "campaign_studio_projects";
const USER_CONTEXT_KEY = "campaign_studio_user_context";

export function listProjects(): StudioProject[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StudioProject[];
    return parsed.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

export function saveProject(project: StudioProject): void {
  const projects = listProjects();
  const index = projects.findIndex((item) => item.id === project.id);

  // Bloc 6 — détection passive d'obsolescence : si la version précédente
  // existe et que des champs sensibles changent, on marque les modules
  // déjà générés comme à rafraîchir. Aucun recalcul automatique — la
  // bannière UX laisse l'utilisateur trancher. Fail-safe : la save ne doit
  // jamais être bloquée par la détection de staleness.
  try {
    const previous = index >= 0 ? projects[index] : undefined;
    detectAndApplyStaleness(previous, project);
  } catch {
    /* noop : la détection est un bonus, pas une condition de sauvegarde */
  }

  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id: string): StudioProject | undefined {
  return listProjects().find((item) => item.id === id);
}

/* ============================================================
   USER CONTEXT — persists cross-session to personalize generation
============================================================ */

export function getUserContext(): UserContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_CONTEXT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as UserContext; } catch { return null; }
}

export function saveUserContext(ctx: UserContext): void {
  if (typeof window === "undefined") return;
  const existing = getUserContext() ?? {};
  const merged: UserContext = {
    ...existing,
    ...ctx,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(merged));
}

/**
 * Infer and update user context from a completed project.
 * Call this after a successful generation.
 */
export function learnFromProject(project: StudioProject): void {
  const ctx = getUserContext() ?? {};
  const recentTopics = ctx.recentTopics ?? [];
  const topic = project.brief.challenge.slice(0, 60);
  const updated: UserContext = {
    ...ctx,
    preferredTone: project.brief.tone || ctx.preferredTone,
    frequentProjectTypes: project.output.projectType
      ? Array.from(new Set([project.output.projectType, ...(ctx.frequentProjectTypes ?? [])]).values()).slice(0, 5)
      : ctx.frequentProjectTypes,
    recentTopics: Array.from(new Set([topic, ...recentTopics])).slice(0, 5),
  };
  saveUserContext(updated);

  // Couche mémoire stratégique : enregistre la signature du projet pour
  // alimenter l'historique, les comparaisons et les tendances.
  // Idempotent par projectId — une régénération remplace l'analyse précédente.
  try {
    recordAnalysis(project);
  } catch {
    // Fail-safe : la mémoire est un bonus, jamais bloquant pour la sauvegarde.
  }
}

/* ============================================================
   COLLABORATION HELPERS
============================================================ */

/** Returns the collaboration layer, initializing it if missing. */
export function getCollab(project: StudioProject): ProjectCollaboration {
  return project.collaboration ?? { sectionMeta: {}, comments: [], activity: [] };
}

/** Update section status, log activity, persist. */
export function updateSectionStatus(
  project: StudioProject,
  sectionId: string,
  status: SectionStatus,
  authorName = "Utilisateur",
): StudioProject {
  const collab = getCollab(project);
  const prev = collab.sectionMeta[sectionId];
  const statusLabels: Record<string, string> = {
    draft: "Brouillon", in_review: "En révision", approved: "Validé", needs_changes: "À retravailler",
  };
  const meta: SectionMeta = { ...(prev ?? {}), status, updatedAt: new Date().toISOString() };
  const activity: ProjectActivityItem = {
    id: crypto.randomUUID(),
    type: "status_change",
    message: `Statut "${sectionId}" → ${statusLabels[status] ?? status}`,
    createdAt: new Date().toISOString(),
    authorName,
  };
  const updated: StudioProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    collaboration: {
      ...collab,
      sectionMeta: { ...collab.sectionMeta, [sectionId]: meta },
      activity: [activity, ...collab.activity].slice(0, 50),
    },
  };
  saveProject(updated);
  return updated;
}

/** Update section owner, log activity, persist. */
export function updateSectionOwner(
  project: StudioProject,
  sectionId: string,
  ownerName: string,
  authorName = "Utilisateur",
): StudioProject {
  const collab = getCollab(project);
  const prev = collab.sectionMeta[sectionId];
  const meta: SectionMeta = { status: "draft", ...(prev ?? {}), ownerName, updatedAt: new Date().toISOString() };
  const activity: ProjectActivityItem = {
    id: crypto.randomUUID(),
    type: "assignment",
    message: `Responsable "${sectionId}" → ${ownerName}`,
    createdAt: new Date().toISOString(),
    authorName,
  };
  const updated: StudioProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    collaboration: {
      ...collab,
      sectionMeta: { ...collab.sectionMeta, [sectionId]: meta },
      activity: [activity, ...collab.activity].slice(0, 50),
    },
  };
  saveProject(updated);
  return updated;
}

/** Add a comment to a section, log activity, persist. */
export function addComment(
  project: StudioProject,
  sectionId: string,
  text: string,
  authorName: string,
): StudioProject {
  const collab = getCollab(project);
  const comment: ProjectComment = {
    id: crypto.randomUUID(),
    sectionId,
    authorName,
    text,
    createdAt: new Date().toISOString(),
    resolved: false,
  };
  const activity: ProjectActivityItem = {
    id: crypto.randomUUID(),
    type: "comment",
    message: `Commentaire sur "${sectionId}" par ${authorName}`,
    createdAt: new Date().toISOString(),
    authorName,
  };
  const updated: StudioProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    collaboration: {
      ...collab,
      comments: [...collab.comments, comment],
      activity: [activity, ...collab.activity].slice(0, 50),
    },
  };
  saveProject(updated);
  return updated;
}

/** Toggle comment resolved state. */
export function resolveComment(
  project: StudioProject,
  commentId: string,
): StudioProject {
  const collab = getCollab(project);
  const updated: StudioProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    collaboration: {
      ...collab,
      comments: collab.comments.map((c) =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c,
      ),
    },
  };
  saveProject(updated);
  return updated;
}

/** Enable sharing — generates a token if none exists. */
export function enableSharing(
  project: StudioProject,
  mode: "view" | "edit" = "view",
): StudioProject {
  const collab = getCollab(project);
  const updated: StudioProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    collaboration: {
      ...collab,
      isShared: true,
      shareMode: mode,
      shareToken: collab.shareToken ?? crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    },
  };
  saveProject(updated);
  return updated;
}

/** Disable sharing. */
export function disableSharing(project: StudioProject): StudioProject {
  const collab = getCollab(project);
  const updated: StudioProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    collaboration: { ...collab, isShared: false },
  };
  saveProject(updated);
  return updated;
}

export function duplicateProject(id: string): StudioProject | undefined {
  const project = getProject(id);
  if (!project) return undefined;

  const duplicated: StudioProject = {
    ...project,
    id: crypto.randomUUID(),
    title: `${project.title} (copie)`,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProject(duplicated);
  return duplicated;
}