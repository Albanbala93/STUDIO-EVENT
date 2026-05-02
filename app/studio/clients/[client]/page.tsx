"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getProjectsByClient } from "../../../../lib/studio/storage";

type ProjectList = ReturnType<typeof getProjectsByClient>;
type ProjectItem = ProjectList[number];

function formatDate(value?: string) {
  if (!value) return "Date inconnue";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Date inconnue";
  }
}

function formatModuleLabel(module: string) {
  if (module === "campaign") return "Campaign";
  if (module === "pilot") return "Pilot";
  if (module === "impact") return "Impact";
  return module;
}

function getProjectModules(project: ProjectItem): Array<"campaign" | "pilot" | "impact"> {
  const projectAny = project as any;

  return (["campaign", "pilot", "impact"] as const).filter((moduleName) =>
    Boolean(projectAny.modules?.[moduleName]?.output),
  );
}

function getEnrichmentCount(project: ProjectItem): number {
  const projectAny = project as any;
  const hints = projectAny.modules?.campaign?.output?.measurementHints as
    | Record<string, unknown>
    | undefined;

  if (!hints) return 0;

  return Object.values(hints).reduce<number>((total, value) => {
    if (Array.isArray(value)) return total + value.length;
    return value ? total + 1 : total;
  }, 0);
}

function getBriefSummary(project: ProjectItem): string {
  const projectAny = project as any;

  const candidates = [
    projectAny.brief?.objective,
    projectAny.brief?.challenge,
    projectAny.brief?.companyContext,
    projectAny.output?.summary,
  ];

  return (
    candidates.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ??
    "Aucun résumé disponible pour ce projet."
  );
}

export default function ClientProjectsPage() {
  const params = useParams<{ client: string }>();

  const clientKey = useMemo(() => {
    const raw = params?.client;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params?.client]);

  const [projects, setProjects] = useState<ProjectList>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!clientKey) return;

    setProjects(getProjectsByClient(clientKey));
    setHydrated(true);
  }, [clientKey]);

  const clientName = projects[0]
    ? (() => {
        const projectAny = projects[0] as any;
        return (
          projectAny.sharedFoundation?.data?.client_company?.value ??
          projectAny.brief?.companyName ??
          projectAny.brief?.companyContext ??
          projectAny.title ??
          decodeURIComponent(clientKey)
        );
      })()
    : decodeURIComponent(clientKey || "Client");

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/studio/clients" className="text-sm font-medium text-blue-700">
                ← Tous les clients
              </Link>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
                Projets client
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {clientName}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Retrouvez les projets associés à ce client, les modules déjà utilisés et les travaux
                à reprendre.
              </p>
            </div>

            <Link
              href="/studio/new"
              className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Nouveau projet
            </Link>
          </div>
        </header>

        {!hydrated ? (
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Chargement des projets…</p>
          </section>
        ) : projects.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Aucun projet trouvé pour ce client.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Ce client n’a pas encore de projet associé ou le nom client a changé.
            </p>
            <Link
              href="/studio/clients"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Revenir aux clients
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            {projects.map((project) => {
              const modules = getProjectModules(project);
              const enrichmentCount = getEnrichmentCount(project);

              return (
                <article
                  key={project.id}
                  className="rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Projet
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          Mis à jour le {formatDate(project.updatedAt)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                        {project.title}
                      </h2>

                      <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {getBriefSummary(project)}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {modules.length > 0 ? (
                          modules.map((module) => (
                            <span
                              key={module}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                            >
                              {formatModuleLabel(module)}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                            Aucun module généré
                          </span>
                        )}

                        <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                          {enrichmentCount} enrichissement{enrichmentCount > 1 ? "s" : ""} disponible
                          {enrichmentCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 md:w-56">
                      <Link
                        href={`/studio/${project.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Reprendre le projet
                      </Link>

                      <Link
                        href={`/momentum/diagnostic?from_campaign=${project.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        Ouvrir Pilot
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}