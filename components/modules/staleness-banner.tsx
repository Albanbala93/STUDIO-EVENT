"use client";

/**
 * <StalenessBanner /> — Bloc 6
 *
 * Bannière sobre affichée sur la page projet quand un ou plusieurs modules
 * déjà générés sont marqués comme obsolètes par le service staleness.
 *
 * Deux actions :
 *   - "Mettre à jour maintenant" → redirection vers le module concerné.
 *   - "Plus tard" → masquage éphémère (sessionStorage). Le marqueur
 *      d'obsolescence reste sur le projet — la bannière réapparaîtra à la
 *      prochaine session jusqu'à régénération effective.
 *
 * Design : ton ambre/orange (alerte sans dramatiser), aligné sur la
 * palette Tailwind du projet, lisible mobile + desktop.
 */

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

import {
  buildRefreshUrl,
  dismissBanner,
  type StaleModuleView,
} from "../../lib/modules/staleness";
import { cn } from "../../lib/utils";

type Props = {
  projectId: string;
  staleModules: StaleModuleView[];
  /** Callback déclenché après un dismiss pour rafraîchir l'UI parente. */
  onDismiss?: (module: StaleModuleView["module"]) => void;
};

export function StalenessBanner({
  projectId,
  staleModules,
  onDismiss,
}: Props) {
  // Filtrage local des modules masqués pendant la session — la liste passée
  // depuis le parent est déjà filtrée en amont, mais on conserve un état
  // local pour réagir instantanément aux clics "Plus tard".
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visible = staleModules.filter((s) => !hidden.has(s.module));
  if (visible.length === 0) return null;

  const handleDismiss = (mod: StaleModuleView) => {
    dismissBanner(projectId, mod.module);
    setHidden((prev) => new Set(prev).add(mod.module));
    onDismiss?.(mod.module);
  };

  return (
    <div className="space-y-2">
      {visible.map((sm) => (
        <BannerCard
          key={sm.module}
          projectId={projectId}
          stale={sm}
          onDismiss={() => handleDismiss(sm)}
        />
      ))}
    </div>
  );
}

function BannerCard({
  projectId,
  stale,
  onDismiss,
}: {
  projectId: string;
  stale: StaleModuleView;
  onDismiss: () => void;
}) {
  const refreshUrl = buildRefreshUrl(projectId, stale.module);

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5",
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-amber-950 leading-tight">
            Cette modification peut affecter {stale.moduleLabel}.
          </p>
          <p className="text-[12.5px] text-amber-900/80 mt-0.5 leading-relaxed">
            {stale.reason}. Les éléments générés peuvent ne plus refléter
            l&apos;état actuel du projet.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={refreshUrl}
          className={cn(
            "inline-flex items-center justify-center px-3.5 py-2 rounded-md",
            "text-[12.5px] font-semibold whitespace-nowrap transition-colors",
            "bg-amber-600 text-white hover:bg-amber-700",
            "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-amber-50",
          )}
        >
          Mettre à jour maintenant
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-2 rounded-md",
            "text-[12.5px] font-medium whitespace-nowrap transition-colors",
            "text-amber-900 hover:bg-amber-100/80",
            "focus:outline-none focus:ring-2 focus:ring-amber-300",
          )}
        >
          <X className="h-3.5 w-3.5" />
          Plus tard
        </button>
      </div>
    </div>
  );
}
