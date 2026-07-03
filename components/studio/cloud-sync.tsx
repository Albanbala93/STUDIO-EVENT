"use client";

/**
 * CloudSync — synchronise les projets Studio à l'entrée dans le module.
 *
 * Bloque brièvement le rendu (au plus ~2,5 s) le temps du pull initial,
 * pour que les pages lisent un cache local à jour. Sans Supabase ou sans
 * session, rend les enfants immédiatement (comportement inchangé).
 */

import { useEffect, useState, type ReactNode } from "react";
import { listProjects, replaceAllProjectsLocal } from "../../lib/studio/storage";
import { syncProjects } from "../../lib/studio/remote";

let alreadySyncedThisSession = false;

export function CloudSync({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(alreadySyncedThisSession);

  useEffect(() => {
    if (alreadySyncedThisSession) return;

    let cancelled = false;
    const failSafe = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 2500);

    (async () => {
      try {
        const merged = await syncProjects(listProjects());
        if (merged) replaceAllProjectsLocal(merged);
      } catch {
        // Le cache local fait foi en cas d'échec réseau.
      } finally {
        alreadySyncedThisSession = true;
        clearTimeout(failSafe);
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          fontSize: 13,
          opacity: 0.55,
        }}
      >
        Synchronisation de vos projets…
      </div>
    );
  }

  return <>{children}</>;
}
