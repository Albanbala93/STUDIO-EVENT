"use client";

/**
 * Wizard Momentum — port simplifié de
 * momentum/apps/web/src/app/diagnostic/page.tsx.
 *
 * Flux :
 *   1. Identification (nom, type d'initiative, audience, taille, intention)
 *   2. Saisie des KPIs (catalogue dépendant du type d'initiative)
 *   3. Scoring + interprétation (100% client-side) → ResultDashboard
 *
 * Hydratation via URL : ?from_campaign=...&name=...&type=...&audience=...&intent=...
 * Sauvegarde intermédiaire localStorage : momentum_wizard_v1
 */

import React, { Suspense, useEffect, useMemo, useReducer } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { KPI_PLAN, INITIATIVE_OPTIONS, AUDIENCE_OPTIONS, INTENT_OPTIONS } from "../../../lib/momentum/kpi-catalog";
import { scoreMomentum, type DimensionSignal } from "../../../lib/momentum/scoring";
import { interpretScore } from "../../../lib/momentum/interpretation";
import { interpretRse } from "../../../lib/momentum/rse";
import {
  CONFIDENCE_MAP,
  DIMENSION_LABELS,
  INITIATIVE_LABELS,
  type ConfidenceLabel,
  type DiagnosticPayload,
  type IdentificationData,
  type InitiativeType,
  type KPIAnswer,
  type KPIQuestion,
  type Provenance,
} from "../../../lib/momentum/types";
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
        answers: { ...state.answers, [action.kpiId]: { ...prev, ...action.patch } },
      };
    }
    case "SET_STEP":
      return { ...state, step: action.step, error: null };
    case "SUBMIT_SUCCESS":
      return { ...state, diagnostic: action.diagnostic, step: "result", error: null };
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
    <Suspense fallback={<div style={{ padding: 40, color: "#94a3b8" }}>Chargement…</div>}>
      <DiagnosticPageInner />
    </Suspense>
  );
}

function DiagnosticPageInner() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const searchParams = useSearchParams();

  // Hydratation depuis URL uniquement (on part toujours d'une feuille vierge :
  // pas de reprise localStorage — le bug "le wizard commence à l'étape 2"
  // venait d'un état persisté. On purge aussi l'ancienne clé au passage.)
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
    if (type && INITIATIVE_OPTIONS.find((o) => o.id === type)) idPatch.initiativeType = type;
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
    try {
      const signals: DimensionSignal[] = Object.values(state.answers)
        .filter((a) => typeof a.value === "number" && !Number.isNaN(a.value))
        .map((a) => {
          const kpi = kpis.find((k) => k.kpiId === a.kpiId);
          return {
            kpi_id: a.kpiId,
            dimension: kpi?.dimension ?? "impact",
            value: Math.max(0, Math.min(100, a.value)),
            provenance: a.provenance,
            confidence: CONFIDENCE_MAP[a.confidenceLabel],
          };
        });
      const score = scoreMomentum(signals);
      const baseline = interpretScore(score);

      // Tentative d'enrichissement LLM (Anthropic) ; fallback silencieux sur
      // la baseline déterministe si l'API est indisponible.
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
            signals,
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

      // Couche RSE additive — calculée localement à partir des mêmes
      // signaux, indépendamment de l'enrichissement LLM.
      const rse = interpretRse(signals);

      dispatch({
        type: "SUBMIT_SUCCESS",
        diagnostic: { score, interpretation, rse },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de calcul";
      dispatch({ type: "SUBMIT_ERROR", error: msg });
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
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link href="/momentum" style={styles.backLink}>
            ← Momentum
          </Link>
          <h1 style={styles.title}>Nouveau diagnostic Momentum</h1>
          <p style={styles.subtitle}>
            Mesurez la performance d&apos;une initiative de communication interne sur
            4 dimensions : mobilisation, implication, compréhension, impact.
          </p>
          <StepNav step={state.step} />
        </header>

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
            answers={state.answers}
            onAnswer={(kpiId, patch) =>
              dispatch({ type: "SET_ANSWER", kpiId, patch })
            }
            onBack={() => dispatch({ type: "SET_STEP", step: "identification" })}
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

function StepNav({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "identification", label: "1. Identification" },
    { id: "kpis", label: "2. KPIs" },
    { id: "result", label: "3. Diagnostic" },
  ];
  return (
    <div style={styles.stepNav}>
      {steps.map((s) => (
        <div
          key={s.id}
          style={{
            ...styles.stepNavItem,
            ...(s.id === step ? styles.stepNavItemActive : {}),
          }}
        >
          {s.label}
        </div>
      ))}
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
    <section style={styles.card}>
      <h2 style={styles.cardTitle}>Identifiez l&apos;initiative</h2>

      <Field label="Nom de l'initiative">
        <input
          style={styles.input}
          value={id.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex. Convention annuelle 2026"
        />
      </Field>

      <Field label="Type d'initiative">
        <div style={styles.chipGrid}>
          {INITIATIVE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              style={{
                ...styles.chip,
                ...(id.initiativeType === opt.id ? styles.chipActive : {}),
              }}
              onClick={() => onChange({ initiativeType: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Audience principale">
        <div style={styles.chipGrid}>
          {AUDIENCE_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              style={{
                ...styles.chip,
                ...(id.audienceType === a ? styles.chipActive : {}),
              }}
              onClick={() => onChange({ audienceType: a })}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Taille de l'audience cible">
        <input
          type="number"
          style={styles.input}
          value={id.audienceSize || ""}
          onChange={(e) =>
            onChange({ audienceSize: Number(e.target.value) || 0 })
          }
          placeholder="Ex. 500"
          min={0}
        />
      </Field>

      <Field label="Intention principale">
        <div style={styles.chipGrid}>
          {INTENT_OPTIONS.map((i) => (
            <button
              key={i}
              type="button"
              style={{
                ...styles.chip,
                ...(id.intent === i ? styles.chipActive : {}),
              }}
              onClick={() => onChange({ intent: i })}
            >
              {i}
            </button>
          ))}
        </div>
      </Field>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.actions}>
        <button style={styles.btnPrimary} onClick={onNext}>
          Continuer →
        </button>
      </div>
    </section>
  );
}

function KPIStep(props: {
  kpis: KPIQuestion[];
  answers: Record<string, KPIAnswer>;
  onAnswer: (kpiId: string, patch: Partial<KPIAnswer>) => void;
  onBack: () => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const { kpis, answers, onAnswer, onBack, onSubmit, error } = props;

  // Groupement par dimension
  const byDim = kpis.reduce<Record<string, KPIQuestion[]>>((acc, k) => {
    (acc[k.dimension] ??= []).push(k);
    return acc;
  }, {});

  const answeredCount = Object.values(answers).filter(
    (a) => typeof a.value === "number" && a.value > 0
  ).length;

  return (
    <section style={styles.card}>
      <h2 style={styles.cardTitle}>Renseignez vos KPIs</h2>
      <p style={styles.helper}>
        Chaque KPI alimente une des 4 dimensions du score Momentum. Renseignez ce
        que vous connaissez, laissez le reste à zéro. ({answeredCount}/{kpis.length}{" "}
        renseignés)
      </p>

      {(Object.keys(byDim) as (keyof typeof byDim)[]).map((dim) => (
        <div key={dim} style={styles.dimBlock}>
          <h3 style={styles.dimTitle}>
            {DIMENSION_LABELS[dim as keyof typeof DIMENSION_LABELS]}
          </h3>
          {byDim[dim].map((k) => (
            <KPIRow
              key={k.kpiId}
              kpi={k}
              answer={answers[k.kpiId]}
              onAnswer={(patch) => onAnswer(k.kpiId, patch)}
            />
          ))}
        </div>
      ))}

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.actions}>
        <button style={styles.btnSecondary} onClick={onBack}>
          ← Retour
        </button>
        <button style={styles.btnPrimary} onClick={onSubmit}>
          Calculer mon diagnostic →
        </button>
      </div>
    </section>
  );
}

function KPIRow(props: {
  kpi: KPIQuestion;
  answer: KPIAnswer | undefined;
  onAnswer: (patch: Partial<KPIAnswer>) => void;
}) {
  const { kpi, answer, onAnswer } = props;
  const value = answer?.value ?? 0;
  const provenance = answer?.provenance ?? kpi.defaultProvenance;
  const confidenceLabel = answer?.confidenceLabel ?? "medium";

  // Initialisation implicite au premier changement
  function update(patch: Partial<KPIAnswer>) {
    onAnswer({
      kpiId: kpi.kpiId,
      value,
      provenance,
      confidenceLabel,
      ...patch,
    });
  }

  return (
    <div style={styles.kpiRow}>
      <div style={styles.kpiHeader}>
        <div>
          <div style={styles.kpiLabel}>{kpi.label}</div>
          <div style={styles.kpiHelper}>{kpi.helper}</div>
        </div>
        <div style={styles.kpiUnit}>{kpi.unitHint}</div>
      </div>

      <div style={styles.kpiControls}>
        <input
          type="number"
          style={styles.input}
          value={value || ""}
          placeholder="0"
          min={0}
          max={100}
          onChange={(e) =>
            update({ value: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
          }
        />

        <select
          style={styles.select}
          value={provenance}
          onChange={(e) => update({ provenance: e.target.value as Provenance })}
        >
          <option value="measured">Mesuré</option>
          <option value="declared">Déclaré</option>
          <option value="estimated">Estimé</option>
          <option value="proxy">Proxy</option>
        </select>

        <select
          style={styles.select}
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    padding: "40px 20px",
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
  },
  header: { marginBottom: 32 },
  backLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: 14,
  },
  title: { fontSize: 28, margin: "12px 0 8px", fontWeight: 700 },
  subtitle: { color: "#94a3b8", fontSize: 15, lineHeight: 1.6 },
  stepNav: {
    display: "flex",
    gap: 8,
    marginTop: 20,
    flexWrap: "wrap",
  },
  stepNavItem: {
    padding: "6px 12px",
    borderRadius: 999,
    background: "#1e293b",
    border: "1px solid #334155",
    fontSize: 13,
    color: "#94a3b8",
  },
  stepNavItemActive: {
    background: "#3b82f6",
    borderColor: "#3b82f6",
    color: "#fff",
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: 28,
  },
  cardTitle: { fontSize: 20, margin: "0 0 16px", color: "#f1f5f9" },
  helper: { color: "#94a3b8", fontSize: 14, marginBottom: 20 },
  field: { marginBottom: 20 },
  fieldLabel: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    boxSizing: "border-box",
  },
  select: {
    padding: "10px 12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
  },
  chipGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    padding: "8px 14px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 999,
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: 14,
  },
  chipActive: {
    background: "#3b82f6",
    borderColor: "#3b82f6",
    color: "#fff",
  },
  dimBlock: {
    marginBottom: 24,
    padding: 16,
    background: "#0f172a",
    borderRadius: 10,
    border: "1px solid #334155",
  },
  dimTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#60a5fa",
    margin: "0 0 12px",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  kpiRow: {
    padding: "14px 0",
    borderBottom: "1px solid #1e293b",
  },
  kpiHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  kpiLabel: { fontSize: 14, fontWeight: 600, color: "#f1f5f9" },
  kpiHelper: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  kpiUnit: { fontSize: 12, color: "#64748b", whiteSpace: "nowrap" as const },
  kpiControls: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  error: {
    padding: 12,
    background: "#7f1d1d",
    color: "#fecaca",
    borderRadius: 8,
    margin: "16px 0",
    fontSize: 14,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
  },
  btnPrimary: {
    padding: "12px 24px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: "auto",
  },
  btnSecondary: {
    padding: "12px 24px",
    background: "transparent",
    color: "#cbd5e1",
    border: "1px solid #334155",
    borderRadius: 8,
    fontSize: 15,
    cursor: "pointer",
  },
};

/* Évite un warning ESLint pour l'import non utilisé éventuel d'INITIATIVE_LABELS */
void INITIATIVE_LABELS;
