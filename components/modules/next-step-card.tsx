"use client";

/**
 * <NextStepRecommendations /> — Bloc 7
 *
 * Affiche 1 à 2 recommandations "prochaine étape" issues du moteur
 * next-step-engine. Design sobre et premium :
 *   - éveille l'envie sans pousser au clic
 *   - chaque carte explique son "pourquoi" (valueProp)
 *   - chevron de continuité (basedOn → toModule) discret en haut de carte
 *
 * Aucune dépendance à un état externe : composant pur, branchable
 * partout (Studio project page, Pilot dashboard, etc.).
 */

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { NextStep } from "../../lib/modules/next-step-engine";
import { cn } from "../../lib/utils";

const MODULE_LABELS: Record<string, string> = {
  campaign: "Campaign",
  pilot: "Pilot",
  impact: "Impact",
};

type Props = {
  steps: NextStep[];
  /** Titre de section affiché au-dessus des cartes (laissé vide pour intégration inline). */
  heading?: string;
  /** Sous-titre court — typiquement "Pour aller plus loin" ou "Suggestions". */
  eyebrow?: string;
};

export function NextStepRecommendations({ steps, heading, eyebrow }: Props) {
  if (steps.length === 0) return null;

  return (
    <section
      aria-label="Prochaines étapes recommandées"
      className="space-y-3"
    >
      {(heading || eyebrow) && (
        <div className="space-y-1">
          {eyebrow && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">
              {eyebrow}
            </span>
          )}
          {heading && (
            <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
              {heading}
            </h3>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {steps.map((step) => (
          <NextStepCard key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}

function NextStepCard({ step }: { step: NextStep }) {
  const fromLabel = step.basedOn ? MODULE_LABELS[step.basedOn] ?? step.basedOn : null;
  const toLabel = MODULE_LABELS[step.toModule] ?? step.toModule;

  return (
    <Link
      href={step.href}
      className={cn(
        "group block rounded-xl border border-slate-200 bg-white p-4 sm:p-5",
        "transition-all hover:border-indigo-300 hover:shadow-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
      )}
    >
      {/* Chevron de continuité : Module source → Module cible */}
      {fromLabel && (
        <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-indigo-700">
          <span className="text-slate-400">{fromLabel}</span>
          <ArrowRight className="h-3 w-3 text-indigo-400" />
          <span>{toLabel}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 shrink-0">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-slate-900 leading-snug">
            {step.title}
          </p>
          <p className="mt-1 text-[12.5px] text-slate-600 leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11.5px] text-slate-500 leading-relaxed">
        <span className="font-medium text-slate-600">Pourquoi maintenant —</span>{" "}
        {step.valueProp}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-indigo-700",
            "transition-transform group-hover:translate-x-0.5",
          )}
        >
          {step.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
