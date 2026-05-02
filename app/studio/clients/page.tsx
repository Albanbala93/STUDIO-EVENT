"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getClientsFromProjects } from "../../../lib/studio/storage";

type ClientSummary = ReturnType<typeof getClientsFromProjects>[number];

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

export default function StudioClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setClients(getClientsFromProjects());
    setHydrated(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-6 py-8 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/studio" className="text-sm font-medium text-blue-700">
              ← Retour Studio
            </Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Clients & projets
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Retrouvez vos projets et reprenez le travail là où vous l’avez laissé.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Stratly regroupe vos projets par client pour vous aider à suivre les modules utilisés,
              les dernières activités et les prochaines étapes.
            </p>
          </div>

          <Link
            href="/studio/new"
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Créer un projet
          </Link>
        </header>

        {!hydrated ? (
          <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Chargement des clients…</p>
          </section>
        ) : clients.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Vous n’avez pas encore de projet enregistré.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Créez un premier projet Campaign pour initialiser votre espace client et commencer
              à capitaliser sur les modules Stratly.
            </p>
            <Link
              href="/studio/new"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Créer mon premier projet
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <article
                key={client.clientId}
                className="group rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Client
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-slate-950">
                      {client.clientName}
                    </h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {client.projectCount} projet{client.projectCount > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Dernière activité</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(client.lastActivityAt)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {client.modulesUsed.length > 0 ? (
                    client.modulesUsed.map((module) => (
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
                </div>

                <Link
                  href={`/studio/clients/${client.clientId}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-blue-700"
                >
                  Voir les projets
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}