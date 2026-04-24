"use client";

/**
 * Wizard Momentum — design system Stratly (Tailwind + shadcn-style).
 *
 * Flux :
 *   1. Identification (nom, type d'initiative, audience, taille, intention)
 *   2. Saisie des KPIs — deux onglets :
 *        · Mesure communication (reach / engagement / appropriation / impact)
 *        · Mesure RSE (environment / social / governance)
 *   3. Scoring + interprétation (100% client-side) → ResultDashboard
 *
 * Hydratation via URL : ?from_campaign=...&name=...&type=...&audience=...&intent=...
 */

import React, { Suspense, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Leaf,
  Loader2,
  Sparkles,
} from "lucide-react";

import {
  KPI_PLAN,
  INITIATIVE_OPTIONS,
  AUDIENCE_OPTIONS,
  INTENT_OPTIONS,
  RSE_KPIS,
} from "../../../lib/momentum/kpi-catalog";
import { scoreMomentum, type DimensionSignal } from "../../../lib/momentum/scoring";
import { interpretScore } from "../../../lib/momentum/interpretation";
import { interpretRse } from "../../../lib/momentum/rse";
import {
  CONFIDENCE_MAP,
  DIMENSION_LABELS,
  INITIATIVE_LABELS,
  RSE_DIMENSION_LABELS,
  type ConfidenceLabel,
  type DiagnosticPayload,
  type IdentificationData,
  type InitiativeType,
  type KPIAnswer,
  type KPIQuestion,
  type Provenance,
  type RSEKPIQuestion,
} from "../../../lib/momentum/types";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { ResultDashboard } from "./dashboard";

/* ═══════════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════════ */

type Step = "identification" | "kpis" | "result";

type WizardState = {
  step: Step;
  id: IdentificationData;
  answers: Record<string, KPIAnswer>;
  diagnostic: DiagnosticPayload | null;
  error: string | null;
  fromCampaignId?: string;
};

const WIZARD_KEY = "momentum_wizard_v1";

const initialState: WizardState = {
  step: "identification",
  id: {
    name: "",
    initiativeType: "",
    audienceType: "",
    audienceSize: 0,
    intent: "",
  },
  answers: {},
  diagnostic: null,
  error: null,
};

type Action =
  | { type: "HYDRATE"; patch: Partial<WizardState> }
  | { type: "SET_ID"; patch: Partial<IdentificationData> }
  | { type: "SET_ANSWER"; kpiId: string; patch: Partial<KPIAnswer> }
  | { type: "SET_STEP"; step: Step }
  | { type: "SUBMIT_SUCCESS"; diagnostic: DiagnosticPayload }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "RESET" };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.patch };
    case "SET_ID":
      return { ...state, id: { ...state.id, ...action.patch } };
    case "SET_ANSWER": {
      const prev = state.answers[action.kpiId] ?? {
        kpiId: action.kpiId,
        value: 0,
        provenance: "declared" as Provenance,
        confidenceLabel: "medium" as ConfidenceLabel,
      };
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.kpiId]: { ...prev, ...action.patch },
        },
      };
    }
    case "SET_STEP":
      return { ...state, step: action.step, error: null };
    case "SUBMIT_SUCCESS":
      return {
        ...state,
        diagnostic: action.diagnostic,
        step: "result",
        error: null,
      };
    case "SUBMIT_ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function DiagnosticPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] text-ink-muted">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Chargement…
        </div>
      }
    >
      <DiagnosticPageInner />
    </Suspense>
  );
}

function DiagnosticPageInner() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(WIZARD_KEY);
      } catch {
        /* noop */
      }
    }

    const fromCampaign = searchParams?.get("from_campaign") ?? undefined;
    const name = searchParams?.get("name");
    const type = searchParams?.get("type") as InitiativeType | null;
    const audience = searchParams?.get("audience");
    const audienceSize = searchParams?.get("audience_size");
    const intent = searchParams?.get("intent");

    const idPatch: Partial<IdentificationData> = {};
    if (name) idPatch.name = name;
    if (type && INITIATIVE_OPTIONS.find((o) => o.id === type))
      idPatch.initiativeType = type;
    if (audience) idPatch.audienceType = audience;
    if (audienceSize && !Number.isNaN(Number(audienceSize)))
      idPatch.audienceSize = Number(audienceSize);
    if (intent) idPatch.intent = intent;

    const patch: Partial<WizardState> = {
      id: { ...initialState.id, ...idPatch },
    };
    if (fromCampaign) patch.fromCampaignId = fromCampaign;

    if (Object.keys(idPatch).length > 0 || fromCampaign) {
      dispatch({ type: "HYDRATE", patch });
    }
  }, [searchParams]);

  const kpis: KPIQuestion[] = useMemo(() => {
    if (!state.id.initiativeType) return [];
    return KPI_PLAN[state.id.initiativeType] ?? [];
  }, [state.id.initiativeType]);

  async function submit() {
    setSubmitting(true);
    try {
      const allAnswers = Object.values(state.answers).filter(
        (a) => typeof a.value === "number" && !Number.isNaN(a.value),
      );

      const commSignals: DimensionSignal[] = allAnswers
        .map((a): DimensionSignal | null => {
          const kpi = kpis.find((k) => k.kpiId === a.kpiId);
          if (!kpi) return null;
          return {
            kpi_id: a.kpiId,
            dimension: kpi.dimension,
            value: Math.max(0, Math.min(100, a.value)),
            provenance: a.provenance,
            confidence: CONFIDENCE_MAP[a.confidenceLabel],
          };
        })
        .filter((s): s is DimensionSignal => s !== null);

      const rseSignals: DimensionSignal[] = allAnswers
        .map((a): DimensionSignal | null => {
          const rseKpi = RSE_KPIS.find((k) => k.kpiId === a.kpiId);
          if (!rseKpi) return null;
          return {
            kpi_id: a.kpiId,
            dimension: "impact",
            value: Math.max(0, Math.min(100, a.value)),
            provenance: a.provenance,
            confidence: CONFIDENCE_MAP[a.confidenceLabel],
          };
        })
        .filter((s): s is DimensionSignal => s !== null);

      const score = scoreMomentum(commSignals);
      const baseline = interpretScore(score);

      let interpretation = baseline;
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 20000);
        const res = await fetch("/api/momentum/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score,
            baseline,
            context: {
              name: state.id.name,
              initiativeType: state.id.initiativeType,
              audienceType: state.id.audienceType,
              audienceSize: state.id.audienceSize,
              intent: state.id.intent,
            },
            signals: commSignals,
          }),
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          if (data && data.interpretation) {
            interpretation = data.interpretation;
          }
        }
      } catch {
        /* fallback baseline */
      }

      const rse = interpretRse(rseSignals);

      dispatch({
        type: "SUBMIT_SUCCESS",
        diagnostic: { score, interpretation, rse },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de calcul";
      dispatch({ type: "SUBMIT_ERROR", error: msg });
    } finally {
      setSubmitting(false);
    }
  }

  /* ─── RÉSULTAT ─── */
  if (state.step === "result" && state.diagnostic) {
    return (
      <ResultDashboard
        diagnostic={state.diagnostic}
        id={state.id}
        answers={state.answers}
        kpis={kpis}
        fromCampaignId={state.fromCampaignId}
        onReset={() => {
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem(WIZARD_KEY);
            } catch {
              /* noop */
            }
          }
          dispatch({ type: "RESET" });
        }}
        onEditData={() => dispatch({ type: "SET_STEP", step: "kpis" })}
      />
    );
  }

  /* ─── WIZARD ─── */
  return (
    <div>
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-5xl px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/momentum"
              className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Momentum
            </Link>
            <span className="text-ink-muted">/</span>
            <span className="text-[13px] font-medium text-ink">
              Nouveau diagnostic
            </span>
          </div>
          <StepBadge step={state.step} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-8 space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-ink leading-tight">
            Mesurez la performance de votre initiative
          </h1>
          <p className="text-[14px] text-ink-muted mt-2 max-w-2xl">
            Diagnostic en deux étapes : identification de l&apos;initiative, puis
            saisie des indicateurs communication et RSE. Moins de 10 minutes
            pour une restitution exécutive complète.
          </p>
        </div>

        <StepNav step={state.step} />

        {state.step === "identification" && (
          <IdentificationStep
            id={state.id}
            onChange={(patch) => dispatch({ type: "SET_ID", patch })}
            onNext={() => {
              if (!state.id.name.trim()) {
                dispatch({
                  type: "SUBMIT_ERROR",
                  error: "Indiquez un nom d'initiative.",
                });
                return;
              }
              if (!state.id.initiativeType) {
                dispatch({
                  type: "SUBMIT_ERROR",
                  error: "Choisissez un type d'initiative.",
                });
                return;
              }
              dispatch({ type: "SET_STEP", step: "kpis" });
            }}
            error={state.error}
          />
        )}

        {state.step === "kpis" && (
          <KPIStep
            kpis={kpis}
            rseKpis={RSE_KPIS}
            answers={state.answers}
            submitting={submitting}
            onAnswer={(kpiId, patch) =>
              dispatch({ type: "SET_ANSWER", kpiId, patch })
            }
            onBack={() =>
              dispatch({ type: "SET_STEP", step: "identification" })
            }
            onSubmit={submit}
            error={state.error}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
   ═══════════════════════════════════════════════════════════════════ */

function StepBadge({ step }: { step: Step }) {
  const idx = step === "identification" ? 1 : step === "kpis" ? 2 : 3;
  return (
    <div className="inline-flex items-center gap-2 rounded-sm bg-accent-50 px-3 py-1.5 text-[12px] font-semibold text-accent-700">
      <Sparkles className="h-3.5 w-3.5" />
      Étape {idx}/3
    </div>
  );
}

function StepNav({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "identification", label: "Identification" },
    { id: "kpis", label: "Indicateurs" },
    { id: "result", label: "Diagnostic" },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-bold transition-colors",
                  active && "bg-accent text-white border-accent",
                  done && "bg-accent/10 text-accent border-accent/30",
                  !active && !done && "bg-white text-ink-muted border-border",
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[13px] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-muted",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 min-w-[32px] transition-colors",
                  i < activeIdx ? "bg-accent/30" : "bg-border",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function IdentificationStep(props: {
  id: IdentificationData;
  onChange: (patch: Partial<IdentificationData>) => void;
  onNext: () => void;
  error: string | null;
}) {
  const { id, onChange, onNext, error } = props;
  return (
    <Card>
      <CardContent className="p-8">
        <div className="mb-6">
          <h2 className="text-[18px] font-semibold text-ink">
            Identifiez l&apos;initiative
          </h2>
          <p className="text-[13px] text-ink-muted mt-1">
            Les informations saisies alimentent le diagnostic et la sélection
            des indicateurs pertinents.
          </p>
        </div>

        <div className="space-y-6">
          <Field label="Nom de l'initiative" required>
            <input
              className={inputCls}
              value={id.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Ex. Convention annuelle 2026"
            />
          </Field>

          <Field label="Type d'initiative" required>
            <ChipGrid
              options={INITIATIVE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
              value={id.initiativeType}
              onChange={(v) =>
                onChange({ initiativeType: v as InitiativeType })
              }
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Audience principale">
              <ChipGrid
                options={AUDIENCE_OPTIONS.map((a) => ({ id: a, label: a }))}
                value={id.audienceType}
                onChange={(v) => onChange({ audienceType: v })}
              />
            </Field>

            <Field label="Taille de l'audience cible">
              <input
                type="number"
                className={inputCls}
                value={id.audienceSize || ""}
                onChange={(e) =>
                  onChange({ audienceSize: Number(e.target.value) || 0 })
                }
                placeholder="Ex. 500"
                min={0}
              />
            </Field>
          </div>

          <Field label="Intention principale">
            <ChipGrid
              options={INTENT_OPTIONS.map((i) => ({ id: i, label: i }))}
              value={id.intent}
              onChange={(v) => onChange({ intent: v })}
            />
          </Field>
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <div className="flex justify-end mt-8">
          <Button variant="primary" size="md" onClick={onNext}>
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── KPI STEP ─── */

type KPITab = "communication" | "rse";

function KPIStep(props: {
  kpis: KPIQuestion[];
  rseKpis: RSEKPIQuestion[];
  answers: Record<string, KPIAnswer>;
  submitting: boolean;
  onAnswer: (kpiId: string, patch: Partial<KPIAnswer>) => void;
  onBack: () => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const {
    kpis,
    rseKpis,
    answers,
    submitting,
    onAnswer,
    onBack,
    onSubmit,
    error,
  } = props;
  const [tab, setTab] = useState<KPITab>("communication");

  const byDim = kpis.reduce<Record<string, KPIQuestion[]>>((acc, k) => {
    (acc[k.dimension] ??= []).push(k);
    return acc;
  }, {});

  const byPillar = rseKpis.reduce<Record<string, RSEKPIQuestion[]>>(
    (acc, k) => {
      (acc[k.rseDimension] ??= []).push(k);
      return acc;
    },
    {},
  );

  const commIds = new Set(kpis.map((k) => k.kpiId));
  const rseIds = new Set(rseKpis.map((k) => k.kpiId));
  const commAnswered = Object.values(answers).filter(
    (a) => commIds.has(a.kpiId) && typeof a.value === "number" && a.value > 0,
  ).length;
  const rseAnswered = Object.values(answers).filter(
    (a) => rseIds.has(a.kpiId) && typeof a.value === "number" && a.value > 0,
  ).length;

  const PILLAR_ORDER: Array<keyof typeof RSE_DIMENSION_LABELS> = [
    "environment",
    "social",
    "governance",
  ];

  return (
    <Card>
      <CardContent className="p-0">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <TabButton
            active={tab === "communication"}
            onClick={() => setTab("communication")}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Mesure communication"
            count={commAnswered}
            total={kpis.length}
          />
          <TabButton
            active={tab === "rse"}
            onClick={() => setTab("rse")}
            icon={<Leaf className="h-4 w-4" />}
            label="Mesure RSE"
            count={rseAnswered}
            total={rseKpis.length}
          />
        </div>

        <div className="p-8">
          {tab === "communication" && (
            <>
              <p className="text-[13px] text-ink-muted mb-6 max-w-2xl">
                Chaque KPI alimente une des quatre dimensions du score Momentum.
                Renseignez ce que vous connaissez, laissez le reste vide — les
                angles morts seront signalés dans le diagnostic.
              </p>
              <div className="space-y-6">
                {(Object.keys(byDim) as (keyof typeof byDim)[]).map((dim) => (
                  <DimensionBlock
                    key={dim}
                    title={
                      DIMENSION_LABELS[dim as keyof typeof DIMENSION_LABELS]
                    }
                  >
                    {byDim[dim].map((k) => (
                      <KPIRow
                        key={k.kpiId}
                        kpiId={k.kpiId}
                        label={k.label}
                        helper={k.helper}
                        unitHint={k.unitHint}
                        defaultProvenance={k.defaultProvenance}
                        answer={answers[k.kpiId]}
                        onAnswer={(patch) => onAnswer(k.kpiId, patch)}
                      />
                    ))}
                  </DimensionBlock>
                ))}
              </div>
            </>
          )}

          {tab === "rse" && (
            <>
              <p className="text-[13px] text-ink-muted mb-6 max-w-2xl">
                13 indicateurs ESG (Environnement, Social, Gouvernance) pour
                compléter le diagnostic avec un volet RSE dédié —
                recommandations et outils prêts à l&apos;emploi.
              </p>
              <div className="space-y-6">
                {PILLAR_ORDER.map((pillar) => {
                  const items = byPillar[pillar] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <DimensionBlock
                      key={pillar}
                      title={RSE_DIMENSION_LABELS[pillar]}
                      accent
                    >
                      {items.map((k) => (
                        <KPIRow
                          key={k.kpiId}
                          kpiId={k.kpiId}
                          label={k.label}
                          helper={k.helper}
                          unitHint={k.unitHint}
                          defaultProvenance={k.defaultProvenance}
                          answer={answers[k.kpiId]}
                          onAnswer={(patch) => onAnswer(k.kpiId, patch)}
                        />
                      ))}
                    </DimensionBlock>
                  );
                })}
              </div>
            </>
          )}

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              size="md"
              onClick={onBack}
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calcul en cours…
                </>
              ) : (
                <>
                  Calculer le diagnostic
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  total,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-3 px-6 py-4 text-[14px] font-semibold border-b-2 transition-colors",
        active
          ? "border-accent text-ink bg-accent-50/40"
          : "border-transparent text-ink-muted hover:text-ink hover:bg-canvas",
      )}
    >
      <span className={active ? "text-accent" : "text-ink-muted"}>{icon}</span>
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex items-center justify-center min-w-[36px] h-5 px-2 rounded-full text-[11px] font-bold",
          active
            ? "bg-accent text-white"
            : "bg-canvas text-ink-muted border border-border",
        )}
      >
        {count}/{total}
      </span>
    </button>
  );
}

function DimensionBlock({
  title,
  accent = false,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "h-1 w-6 rounded-full",
            accent ? "bg-accent" : "bg-navy",
          )}
        />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
          {title}
        </h3>
      </div>
      <div className="rounded-md border border-border bg-white divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function KPIRow(props: {
  kpiId: string;
  label: string;
  helper: string;
  unitHint: string;
  defaultProvenance: Provenance;
  answer: KPIAnswer | undefined;
  onAnswer: (patch: Partial<KPIAnswer>) => void;
}) {
  const {
    kpiId,
    label,
    helper,
    unitHint,
    defaultProvenance,
    answer,
    onAnswer,
  } = props;
  const value = answer?.value ?? 0;
  const provenance = answer?.provenance ?? defaultProvenance;
  const confidenceLabel = answer?.confidenceLabel ?? "medium";
  const hasValue = value > 0;

  function update(patch: Partial<KPIAnswer>) {
    onAnswer({
      kpiId,
      value,
      provenance,
      confidenceLabel,
      ...patch,
    });
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-semibold text-ink">{label}</div>
            {hasValue && (
              <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
            )}
          </div>
          <div className="text-[12px] text-ink-muted mt-1 leading-relaxed">
            {helper}
          </div>
        </div>
        <div className="text-[11px] text-ink-muted whitespace-nowrap font-mono">
          {unitHint}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          type="number"
          className={inputCls}
          value={value || ""}
          placeholder="0"
          min={0}
          max={100}
          onChange={(e) =>
            update({
              value: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
            })
          }
        />
        <select
          className={selectCls}
          value={provenance}
          onChange={(e) => update({ provenance: e.target.value as Provenance })}
        >
          <option value="measured">Mesuré</option>
          <option value="declared">Déclaré</option>
          <option value="estimated">Estimé</option>
          <option value="proxy">Proxy</option>
        </select>
        <select
          className={selectCls}
          value={confidenceLabel}
          onChange={(e) =>
            update({ confidenceLabel: e.target.value as ConfidenceLabel })
          }
        >
          <option value="high">Fiabilité haute</option>
          <option value="medium">Fiabilité moyenne</option>
          <option value="low">Fiabilité faible</option>
        </select>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink mb-2">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function ChipGrid({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "inline-flex items-center px-3 py-2 rounded-sm border text-[13px] font-medium transition-all",
              active
                ? "bg-navy text-white border-navy shadow-card"
                : "bg-white text-ink border-border hover:border-ink-muted/40 hover:bg-canvas",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-sm border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
      {children}
    </div>
  );
}

const inputCls =
  "block w-full rounded-sm border border-border bg-white px-3 py-2 text-[14px] text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";

const selectCls =
  "block w-full rounded-sm border border-border bg-white px-3 py-2 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors cursor-pointer";

/* Évite un warning ESLint pour l'import non utilisé éventuel d'INITIATIVE_LABELS */
void INITIATIVE_LABELS;
