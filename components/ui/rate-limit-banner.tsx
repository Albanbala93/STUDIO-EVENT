"use client";

import { AlertCircle } from "lucide-react";

type RateLimitBannerProps = {
  /** Message principal — par défaut le message de la spec. */
  message?: string;
  /** ISO date du prochain reset, optionnelle (affichée discrètement). */
  resetsAt?: string;
};

/**
 * Card warning sobre — affichée quand l'utilisateur a atteint le quota
 * quotidien d'appels Anthropic. Ton non-alarmiste, fond ambre clair.
 */
export function RateLimitBanner({ message, resetsAt }: RateLimitBannerProps) {
  const text =
    message ??
    "Vous avez atteint votre limite d'utilisation quotidienne (100 requêtes). Votre quota se renouvelle demain à minuit. Une question ? Contactez-nous.";

  return (
    <div
      role="alert"
      className="flex gap-3 items-start rounded-xl border border-amber-200 bg-[#FFFBEB] px-4 py-3 text-amber-900"
    >
      <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-amber-100 text-amber-700">
        <AlertCircle size={16} strokeWidth={2} />
      </span>
      <div className="flex-1 text-[13.5px] leading-relaxed">
        <p className="m-0 font-medium text-amber-900">{text}</p>
        {resetsAt ? (
          <p className="m-0 mt-1 text-xs text-amber-700/80">
            Prochain renouvellement : {formatReset(resetsAt)} (UTC).
          </p>
        ) : null}
      </div>
      <a
        href="mailto:contact@stratly.io?subject=Quota%20quotidien%20Stratly"
        className="self-center rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:border-amber-400 hover:bg-amber-50"
      >
        Contacter l&rsquo;équipe
      </a>
    </div>
  );
}

function formatReset(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
