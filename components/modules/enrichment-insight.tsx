"use client";

/**
 * <EnrichmentInsightPanel />
 *
 * Bloc 5 — rend visible la traçabilité de l'enrichissement inter-modules.
 * Le moteur Bloc 4 (lib/modules/enrichment-engine) produit `selectedEnrichments` :
 * une liste d'EnrichmentItem avec `family` (objectifs, audiences, KPIs…),
 * `source` (validé / hérité / saisi / suggéré) et `sourceModule` (campaign /
 * pilot / impact / brief projet). Ce composant les expose à l'utilisateur de
 * manière sobre et premium :
 *
 *   - Mode `compact`   : pour les pages projet (1 ligne discrète, dépliable)
 *   - Mode plein       : pour les wizards (panneau dépliable groupé par famille)
 *
 * Vide → message "Ce module utilise actuellement le brief projet seul."
 *
 * L'édition se fait dans les formulaires existants en aval — le panneau
 * mentionne explicitement ce point pour rester non-technique.
 */

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

import type {
  EnrichmentItem,
  EnrichmentSource,
  ModuleName,
} from "../../lib/modules/enrichment-engine";
import { cn } from "../../lib/utils";

type Props = {
  items: EnrichmentItem[];
  /** Mode compact (1 ligne dépliable) — par défaut faux (panneau complet). */
  compact?: boolean;
  /** Message custom pour l'état vide. */
  emptyMessage?: string;
  /** Hint d'édition affiché en bas du panneau plein. */
  editHint?: string;
};

/* ──────────────────────────────────────────────────────────────────────
   Mappings labels / couleurs
   ────────────────────────────────────────────────────────────────────── */

const FAMILY_LABELS: Record<string, string> = {
  objectives: "Objectifs",
  audiences: "Audiences",
  keyMessages: "Messages clés",
  risks: "Risques",
  constraints: "Contraintes",
  kpis: "Indicateurs clés",
  surveyQuestions: "Questions baromètre",
  recommendations: "Recommandations",
  impactTopics: "Sujets d'impact",
  comexInsights: "Insights COMEX",
  rseRisks: "Risques RSE",
  actionPlan: "Plan d'action",
  measurementPlan: "Plan de mesure",
  expectedBehaviorChanges: "Changements de comportement",
  momentsToMeasure: "Moments à mesurer",
};

const FAMILY_ORDER: string[] = [
  "objectives",
  "audiences",
  "keyMessages",
  "risks",
  "constraints",
  "kpis",
  "recommendations",
  "comexInsights",
  "impactTopics",
  "rseRisks",
  "expectedBehaviorChanges",
  "momentsToMeasure",
  "surveyQuestions",
  "measurementPlan",
  "actionPlan",
];

const SOURCE_META: Record<
  EnrichmentSource,
  { label: string; cls: string }
> = {
  validated: {
    label: "Validé",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  inherited: {
    label: "Hérité",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  user_entered: {
    label: "Saisi",
    cls: "bg-slate-100 text-slate-700 border-slate-200",
  },
  suggested: {
    label: "Suggéré",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

type ModuleKey = ModuleName | "foundation";

const MODULE_META: Record<ModuleKey, { label: string; cls: string }> = {
  campaign: {
    label: "Campaign",
    cls: "bg-sky-50 text-sky-700 border-sky-200",
  },
  pilot: {
    label: "Pilot",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
  },
  impact: {
    label: "Impact",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  foundation: {
    label: "Brief projet",
    cls: "bg-neutral-100 text-neutral-700 border-neutral-200",
  },
};

const SOURCE_PRIORITY: Record<EnrichmentSource, number> = {
  validated: 4,
  user_entered: 3,
  inherited: 2,
  suggested: 1,
};

/* ──────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────── */

function itemToText(item: EnrichmentItem): string {
  const v = item.value;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    for (const k of [
      "indicator",
      "name",
      "label",
      "title",
      "action",
      "message",
      "text",
      "summary",
      "question",
    ]) {
      const val = obj[k];
      if (typeof val === "string" && val.trim()) return val;
    }
  }
  return "—";
}

function truncate(s: string, n = 110): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

type FamilyGroup = { family: string; items: EnrichmentItem[] };

function groupByFamily(items: EnrichmentItem[]): FamilyGroup[] {
  const map = new Map<string, EnrichmentItem[]>();
  for (const item of items) {
    const list = map.get(item.family) ?? [];
    list.push(item);
    map.set(item.family, list);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) => SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source],
    );
  }
  // Familles connues d'abord (dans l'ordre de la matrice), puis le reste
  const knownOrder = FAMILY_ORDER.filter((f) => map.has(f));
  const extras = Array.from(map.keys()).filter(
    (f) => !FAMILY_ORDER.includes(f),
  );
  return [...knownOrder, ...extras].map((family) => ({
    family,
    items: map.get(family)!,
  }));
}

/* ──────────────────────────────────────────────────────────────────────
   Composant principal
   ────────────────────────────────────────────────────────────────────── */

export function EnrichmentInsightPanel({
  items,
  compact = false,
  emptyMessage,
  editHint,
}: Props) {
  const groups = useMemo(() => groupByFamily(items), [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] text-neutral-600">
        {emptyMessage ?? "Ce module utilise actuellement le brief projet seul."}
      </div>
    );
  }

  if (compact) {
    return (
      <CompactPanel
        groups={groups}
        totalCount={items.length}
        editHint={editHint}
      />
    );
  }

  return (
    <FullPanel
      groups={groups}
      totalCount={items.length}
      editHint={editHint}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Mode plein — wizards
   ────────────────────────────────────────────────────────────────────── */

function FullPanel({
  groups,
  totalCount,
  editHint,
}: {
  groups: FamilyGroup[];
  totalCount: number;
  editHint?: string;
}) {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-100 text-sky-700 shrink-0">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-slate-900 leading-tight">
            Informations déjà intégrées dans ce module
          </h3>
          <p className="text-[12.5px] text-slate-600 mt-0.5 leading-relaxed">
            {totalCount} élément{totalCount > 1 ? "s" : ""} repris
            automatiquement de vos précédents travaux.
          </p>
        </div>
      </div>

      <FamilyList groups={groups} initialOpenCount={2} />

      <p className="mt-3 text-[11.5px] text-slate-500 leading-relaxed">
        {editHint ??
          "Vous pouvez ajuster ces éléments dans les sections ci-dessous."}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Mode compact — pages projet
   ────────────────────────────────────────────────────────────────────── */

function CompactPanel({
  groups,
  totalCount,
  editHint,
}: {
  groups: FamilyGroup[];
  totalCount: number;
  editHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const teaserFamilies = groups
    .slice(0, 4)
    .map((g) => FAMILY_LABELS[g.family] ?? g.family);
  const moreFamilies = groups.length - teaserFamilies.length;

  return (
    <div className="rounded-md border border-sky-200 bg-sky-50/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-sky-50/70 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sparkles className="h-3.5 w-3.5 text-sky-600 shrink-0" />
          <span className="text-[12.5px] text-sky-900 truncate">
            <strong className="font-semibold">{totalCount}</strong> information
            {totalCount > 1 ? "s" : ""} déjà intégrée{totalCount > 1 ? "s" : ""}{" "}
            <span className="text-sky-700/80">
              · {teaserFamilies.join(", ")}
              {moreFamilies > 0 ? ` + ${moreFamilies}` : ""}
            </span>
          </span>
        </div>
        <span className="text-[11px] font-medium text-sky-700 shrink-0">
          {open ? "Masquer" : "Voir le détail"}
        </span>
      </button>

      {open && (
        <div className="border-t border-sky-200 bg-white p-3">
          <FamilyList groups={groups} initialOpenCount={1} />
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            {editHint ??
              "Ces éléments sont repris depuis le brief et les autres modules. Ils restent éditables dans leurs sections d'origine."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Liste de familles dépliables — réutilisée plein + compact
   ────────────────────────────────────────────────────────────────────── */

function FamilyList({
  groups,
  initialOpenCount,
}: {
  groups: FamilyGroup[];
  initialOpenCount: number;
}) {
  const [openFamilies, setOpenFamilies] = useState<Set<string>>(
    () => new Set(groups.slice(0, initialOpenCount).map((g) => g.family)),
  );
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleFamily = (family: string) => {
    setOpenFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });
  };

  const toggleExpanded = (family: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });
  };

  const ITEMS_PREVIEW = 3;

  return (
    <ul className="space-y-1.5">
      {groups.map(({ family, items }) => {
        const isOpen = openFamilies.has(family);
        const isExpanded = expandedFamilies.has(family);
        const visible = isExpanded ? items : items.slice(0, ITEMS_PREVIEW);
        const overflow = items.length - ITEMS_PREVIEW;
        return (
          <li
            key={family}
            className="rounded-md border border-sky-100 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleFamily(family)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-sky-50/50 transition-colors text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                )}
                <span className="text-[13px] font-semibold text-slate-800 truncate">
                  {FAMILY_LABELS[family] ?? family}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tabular-nums shrink-0">
                {items.length}
              </span>
            </button>

            {isOpen && (
              <ul className="border-t border-sky-100 divide-y divide-sky-50/80">
                {visible.map((item) => (
                  <li key={item.id} className="px-3 py-2.5">
                    <p className="text-[13px] text-slate-800 leading-snug">
                      {truncate(itemToText(item))}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge
                        {...MODULE_META[item.sourceModule ?? "foundation"]}
                      />
                      <Badge {...SOURCE_META[item.source]} />
                    </div>
                  </li>
                ))}
                {overflow > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(family)}
                      className="w-full text-left px-3 py-2 text-[11.5px] font-medium text-sky-700 hover:bg-sky-50/60 transition-colors"
                    >
                      {isExpanded
                        ? "Réduire la liste"
                        : `+ ${overflow} autre${overflow > 1 ? "s" : ""}`}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Badge — petite pastille module / source
   ────────────────────────────────────────────────────────────────────── */

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.05em] rounded border whitespace-nowrap",
        cls,
      )}
    >
      {label}
    </span>
  );
}
