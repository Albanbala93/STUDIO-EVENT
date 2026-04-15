"use client";

import type { EventCopilot, EventFormatRecommendation } from "../../lib/studio/types";

/* ========================
   Category label map
======================== */

const CATEGORY_LABELS: Record<string, string> = {
  "sensibilisation-changement": "Sensibilisation au changement",
  "mise-en-oeuvre": "Mise en œuvre opérationnelle",
  "nouvelle-organisation": "Nouvelle organisation",
  "onboarding": "Onboarding & intégration",
  "communication-crise": "Communication de crise",
  "engagement-commercial": "Engagement commercial",
  "celebration-reconnaissance": "Célébration & reconnaissance",
  "dispositifs-permanents": "Dispositifs permanents",
};

/* ========================
   Relevance score bar
======================== */

function RelevanceBar({ score }: { score: number }) {
  return (
    <div className="event-relevance">
      <div className="event-relevance-track">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`event-relevance-pip${n <= score ? " event-relevance-pip-on" : ""}`}
          />
        ))}
      </div>
      <span className="event-relevance-label">{score}/5</span>
    </div>
  );
}

/* ========================
   Implementation level badge
======================== */

function ImplBadge({ level }: { level: string }) {
  const cls = level === "léger"
    ? "event-impl-badge event-impl-leger"
    : level === "structurant"
    ? "event-impl-badge event-impl-structurant"
    : "event-impl-badge event-impl-intermediaire";
  return <span className={cls}>{level}</span>;
}

/* ========================
   Format card (primary / secondary / permanent)
======================== */

function FormatCard({
  rec,
  variant,
}: {
  rec: EventFormatRecommendation;
  variant: "primary" | "secondary" | "permanent";
}) {
  return (
    <div className={`event-format-card event-format-card-${variant}`}>
      <div className="event-format-card-header">
        <span className="event-category-tag">{CATEGORY_LABELS[rec.category] ?? rec.category}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ImplBadge level={rec.implementationLevel} />
          <RelevanceBar score={rec.relevanceScore} />
        </div>
      </div>
      <p className="event-format-card-name">{rec.format}</p>
      <div className="event-format-card-why">
        <span className="event-format-card-why-label">Pourquoi ce format</span>
        <p>{rec.whyRecommended}</p>
      </div>
      <div className="event-format-card-meta">
        <div className="event-format-card-impact">
          <span className="event-format-card-meta-label">Impact attendu</span>
          <p>{rec.expectedImpact}</p>
        </div>
        <div className="event-format-card-usage">
          <span className="event-format-card-meta-label">Quand / comment</span>
          <p>{rec.usageContext}</p>
        </div>
      </div>
    </div>
  );
}

/* ========================
   Section block
======================== */

function EventSection({
  number,
  title,
  accent,
  children,
}: {
  number: string;
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`event-section${accent ? " event-section-accent" : ""}`}>
      <div className="event-section-header">
        <span className="event-section-num">{number}</span>
        <h3 className="event-section-title">{title}</h3>
      </div>
      <div className="event-section-body">{children}</div>
    </div>
  );
}

/* ========================
   Phase block (before / during / after)
======================== */

function EventPhase({ phase, label }: { phase: string; label: string }) {
  return (
    <div className="event-phase">
      <p className="event-phase-label">{label}</p>
      <p className="event-phase-text">{phase}</p>
    </div>
  );
}

/* ========================
   Main component
======================== */

export function EventCopilotView({ copilot }: { copilot: EventCopilot }) {
  // Guard for legacy format (old projects with shouldUseEvent structure)
  if (!copilot.primaryEventFormats) {
    return (
      <div className="event-no-event">
        <p className="event-no-event-title">Projet à régénérer</p>
        <p className="event-no-event-text">
          Ce projet a été généré avec une version antérieure du copilote.
          Régénérez-le depuis le brief pour accéder aux recommandations événementielles.
        </p>
      </div>
    );
  }

  return (
    <div className="event-copilot-view">

      {/* Strategic intent banner */}
      <div className="event-intent-banner">
        <p className="event-intent-label">Intention stratégique du dispositif</p>
        <p className="event-intent-text">{copilot.strategicIntent}</p>
      </div>

      {/* Section 01 — Primary formats */}
      <EventSection number="01" title="Formats principaux recommandés" accent>
        <div className="event-formats-grid">
          {copilot.primaryEventFormats.map((f, i) => (
            <FormatCard key={i} rec={f} variant="primary" />
          ))}
        </div>
      </EventSection>

      {/* Section 02 — Secondary formats */}
      {copilot.secondaryEventFormats.length > 0 && (
        <EventSection number="02" title="Formats complémentaires">
          <div className="event-formats-grid">
            {copilot.secondaryEventFormats.map((f, i) => (
              <FormatCard key={i} rec={f} variant="secondary" />
            ))}
          </div>
        </EventSection>
      )}

      {/* Section 03 — Permanent devices */}
      {copilot.permanentCommunicationDevices.length > 0 && (
        <EventSection number="03" title="Dispositifs permanents associés">
          <div className="event-permanent-grid">
            {copilot.permanentCommunicationDevices.map((d, i) => (
              <FormatCard key={i} rec={d} variant="permanent" />
            ))}
          </div>
        </EventSection>
      )}

      {/* Section 04 — Why this mix */}
      <EventSection number="04" title="Justification du mix">
        <p className="event-body-text" style={{ marginBottom: 14 }}>{copilot.whyTheseFormats}</p>
        <div className="event-mix-block">
          <span className="event-mix-label">Comment les formats s'articulent</span>
          <p>{copilot.recommendedMix}</p>
        </div>
      </EventSection>

      {/* Section 05 — Role in strategy */}
      <EventSection number="05" title="Rôle dans la stratégie globale">
        <p className="event-body-text event-body-text-featured">{copilot.eventRoleInStrategy}</p>
      </EventSection>

      {/* Section 06 — Before / During / After */}
      {(copilot.beforePhase || copilot.duringPhase || copilot.afterPhase) && (
        <EventSection number="06" title="Dispositif Avant · Pendant · Après">
          <div className="event-phases">
            {copilot.beforePhase && <EventPhase phase={copilot.beforePhase} label="Avant" />}
            {copilot.duringPhase && <EventPhase phase={copilot.duringPhase} label="Pendant" />}
            {copilot.afterPhase && <EventPhase phase={copilot.afterPhase} label="Après" />}
          </div>
        </EventSection>
      )}

      {/* Section 07 — Manager activation */}
      {copilot.managerActivation && (
        <EventSection number="07" title="Activation des managers">
          <p className="event-body-text">{copilot.managerActivation}</p>
        </EventSection>
      )}

      {/* Section 08 — Participant experience */}
      {copilot.participantExperience && (
        <EventSection number="08" title="Expérience participant">
          <p className="event-body-text event-body-text-featured">{copilot.participantExperience}</p>
        </EventSection>
      )}

      {/* Section 09 — Storytelling */}
      {copilot.eventStorytelling && (
        <EventSection number="09" title="Fil narratif">
          <p className="event-body-text">{copilot.eventStorytelling}</p>
        </EventSection>
      )}

      {/* Section 10 — Watchouts */}
      {copilot.watchouts.length > 0 && (
        <EventSection number="10" title="Points de vigilance">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {copilot.watchouts.map((w, i) => (
              <div key={i} className="event-risk-item">
                <span className="event-risk-dot" />
                <p>{w}</p>
              </div>
            ))}
          </div>
        </EventSection>
      )}

      {/* Section 11 — Formats to avoid */}
      {copilot.formatsToAvoid.length > 0 && (
        <EventSection number="11" title="Formats déconseillés dans ce contexte">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {copilot.formatsToAvoid.map((f, i) => (
              <div key={i} className="event-avoid-item">
                <span className="event-avoid-icon">✕</span>
                <p>{f}</p>
              </div>
            ))}
          </div>
        </EventSection>
      )}

    </div>
  );
}
