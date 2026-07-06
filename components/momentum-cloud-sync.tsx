"use client";

/**
 * Synchronise les diagnostics Momentum à l'entrée dans le module.
 * Même mécanique que CloudSync (Studio) : pull initial bloquant au plus
 * ~2,5 s, cache local à jour, no-op sans Supabase ou hors connexion.
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  listProjects,
  replaceAllProjectsLocal,
} from "../lib/momentum/storage";
import { syncDiagnostics } from "../lib/momentum/remote";

let alreadySyncedThisSession = false;

export function MomentumCloudSync({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(alreadySyncedThisSession);

  useEffect(() => {
    if (alreadySyncedThisSession) return;

    let cancelled = false;
    const failSafe = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 2500);

    (async () => {
      try {
        const merged = await syncDiagnostics(listProjects());
        if (merged) replaceAllProjectsLocal(merged);
      } catch {
        // Le cache local fait foi.
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
        Synchronisation de vos diagnostics…
      </div>
    );
  }

  return <>{children}</>;
}
