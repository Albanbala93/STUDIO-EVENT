/**
 * Catalogue statique de templates de mesure — MVP testable client.
 *
 * Objectif : quand l'utilisateur voit une recommandation (ex. "Accélérer la
 * compréhension des messages"), il peut cliquer "Utiliser ce template" et
 * obtenir en 30 secondes un questionnaire prêt à copier-coller dans
 * Typeform / Google Forms / Microsoft Forms.
 *
 * Phase 1 (ce fichier) : templates hardcodés pour les 4 dimensions.
 *   - reach         (mobilisation)
 *   - engagement    (implication)
 *   - appropriation (compréhension des messages)
 *   - impact
 *
 * Phase 2 (hors scope MVP) : génération dynamique par LLM selon le contexte
 * projet (type d'initiative, intent, audience, signaux faibles).
 */

import type { Dimension } from "./dashboard";

export type Timing = "a_chaud" | "j_plus_2" | "j_plus_7" | "j_plus_30";

export type QuestionScale =
  | { kind: "likert_5"; labels: [string, string] } // 1-5 avec étiquettes pôle bas / pôle haut
  | { kind: "likert_10"; labels: [string, string] }
  | { kind: "open_short" }                           // texte libre court
  | { kind: "yes_no" }
  | { kind: "multiple_choice"; options: string[] };

export type TemplateQuestion = {
  id: string;
  text: string;
  scale: QuestionScale;
  /** Pour l'export : si true, la question est obligatoire. */
  required?: boolean;
};

export type Template = {
  id: string;
  dimension: Dimension;
  title: string;
  /** Quand et pourquoi l'utiliser — phrase courte. */
  context: string;
  /** Fenêtre de diffusion recommandée. */
  timing: Timing;
  questions: TemplateQuestion[];
  /** 2-3 conseils actionnables pour bien utiliser le template. */
  tips: string[];
};

/* ─────────────────────────────────────────────────────────────────────
   LIBELLÉS
   ───────────────────────────────────────────────────────────────────── */

export const TIMING_LABELS: Record<Timing, string> = {
  a_chaud: "À chaud (< 24h après l'action)",
  j_plus_2: "J+2 à J+3",
  j_plus_7: "J+7",
  j_plus_30: "J+30",
};

/* ─────────────────────────────────────────────────────────────────────
   CATALOGUE
   ───────────────────────────────────────────────────────────────────── */

export const TEMPLATES: Template[] = [
  /* ═══════════════════════════════════════════════
     MOBILISATION (reach)
     ═══════════════════════════════════════════════ */
  {
    id: "reach.coverage_check",
    dimension: "reach",
    title: "Check de couverture d'audience",
    context:
      "Pour vérifier que les bons publics ont bien été touchés par l'action — au-delà du simple nombre de diffusions. À envoyer aux cibles prévues (y compris ceux qui n'ont pas assisté), dans les 48h.",
    timing: "j_plus_2",
    questions: [
      {
        id: "q1",
        text: "Avez-vous été informé(e) de cette action avant qu'elle ait lieu ?",
        scale: { kind: "yes_no" },
        required: true,
      },
      {
        id: "q2",
        text: "Si oui, par quel canal l'avez-vous appris en priorité ?",
        scale: {
          kind: "multiple_choice",
          options: ["Email", "Manager / N+1", "Collègue", "Intranet / Slack / Teams", "Affichage", "Autre"],
        },
      },
      {
        id: "q3",
        text: "L'information vous a-t-elle semblé arriver au bon moment ?",
        scale: { kind: "likert_5", labels: ["Trop tard / trop tôt", "Parfait timing"] },
      },
      {
        id: "q4",
        text: "Avez-vous participé à l'action (en présentiel, à distance, en replay) ?",
        scale: { kind: "yes_no" },
        required: true,
      },
      {
        id: "q5",
        text: "Si non, quelle a été la raison principale ?",
        scale: { kind: "open_short" },
      },
    ],
    tips: [
      "Comparez le taux de réponse entre populations cibles — un écart > 20% révèle un angle mort de diffusion.",
      "Les canaux cités en q2 sont vos canaux réellement efficaces, pas ceux que vous pensez utiliser.",
      "Les raisons de non-participation (q5) pilotent vos prochains plans de diffusion mieux que n'importe quelle stat d'ouverture.",
    ],
  },
  {
    id: "reach.channel_effectiveness",
    dimension: "reach",
    title: "Audit d'efficacité des canaux",
    context:
      "Pour évaluer quels canaux internes touchent réellement les collaborateurs — utile en fin de trimestre ou après une campagne multicanale. Idéal pour challenger les investissements en communication.",
    timing: "j_plus_7",
    questions: [
      {
        id: "q1",
        text: "Parmi les canaux internes suivants, lesquels consultez-vous au moins une fois par semaine ?",
        scale: {
          kind: "multiple_choice",
          options: ["Email corporate", "Newsletter", "Intranet", "Slack / Teams", "Affichage physique", "Réunion d'équipe", "Aucun"],
        },
        required: true,
      },
      {
        id: "q2",
        text: "Quel canal est le plus crédible pour recevoir une information stratégique importante ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q3",
        text: "À quelle fréquence estimez-vous avoir raté une communication importante ces 3 derniers mois ?",
        scale: {
          kind: "multiple_choice",
          options: ["Jamais", "Rarement", "Parfois", "Souvent", "Très fréquemment"],
        },
        required: true,
      },
      {
        id: "q4",
        text: "Qu'est-ce qui vous fait ouvrir / cliquer un message interne plutôt qu'un autre ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q5",
        text: "Sur une échelle de 1 à 5, la communication interne arrive-t-elle jusqu'à vous ?",
        scale: { kind: "likert_5", labels: ["Jamais", "Toujours"] },
        required: true,
      },
    ],
    tips: [
      "Croisez q1 et q3 : si Slack domine mais les gens ratent encore des infos, c'est un problème de volume, pas de canal.",
      "Les verbatims q4 sont votre brief de rédaction pour les prochaines campagnes — formule, ton, format.",
      "Segmentez par population (cadre / opérateur / télétravailleur) — les canaux efficaces varient énormément.",
    ],
  },

  /* ═══════════════════════════════════════════════
     IMPLICATION (engagement)
     ═══════════════════════════════════════════════ */
  {
    id: "engagement.live_pulse",
    dimension: "engagement",
    title: "Pulse d'implication à chaud",
    context:
      "À envoyer juste après l'action (événement, campagne, live) pour capter l'implication quand elle est fraîche. Réponses rapides, taux de retour élevé.",
    timing: "a_chaud",
    questions: [
      {
        id: "q1",
        text: "Sur une échelle de 1 à 10, à quel point vous êtes-vous senti(e) impliqué(e) pendant cette action ?",
        scale: { kind: "likert_10", labels: ["Pas du tout impliqué", "Très impliqué"] },
        required: true,
      },
      {
        id: "q2",
        text: "Avez-vous participé activement (question, vote, échange, prise de parole) ?",
        scale: { kind: "yes_no" },
      },
      {
        id: "q3",
        text: "Qu'est-ce qui vous a le plus donné envie de participer ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q4",
        text: "Qu'est-ce qui vous a freiné ou empêché de vous impliquer davantage ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q5",
        text: "Recommanderiez-vous à un collègue de participer à une action de ce type ?",
        scale: { kind: "likert_5", labels: ["Pas du tout", "Absolument"] },
        required: true,
      },
    ],
    tips: [
      "Envoyez dans les 2 heures qui suivent — le taux de réponse chute après 24h.",
      "Limitez à 5 questions maximum : 60 secondes pour répondre, c'est la règle.",
      "Ajoutez une question ouverte sur le freinage — c'est là que vous trouverez les angles morts.",
    ],
  },
  {
    id: "engagement.retrospective",
    dimension: "engagement",
    title: "Rétrospective d'implication J+7",
    context:
      "Pour mesurer l'implication durable — est-ce que les gens en parlent encore, ont-ils pris des initiatives suite à l'action ?",
    timing: "j_plus_7",
    questions: [
      {
        id: "q1",
        text: "Depuis l'action, avez-vous échangé avec des collègues sur le sujet ?",
        scale: {
          kind: "multiple_choice",
          options: ["Jamais", "Une fois", "Plusieurs fois", "Très régulièrement"],
        },
        required: true,
      },
      {
        id: "q2",
        text: "Avez-vous initié une action concrète suite à cet événement ?",
        scale: { kind: "yes_no" },
      },
      {
        id: "q3",
        text: "Si oui, laquelle ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q4",
        text: "À quel point vous sentez-vous encore impliqué(e) dans le sujet aujourd'hui ?",
        scale: { kind: "likert_5", labels: ["Plus du tout", "Totalement"] },
        required: true,
      },
      {
        id: "q5",
        text: "Qu'est-ce qui vous aiderait à rester mobilisé(e) sur ce sujet ?",
        scale: { kind: "open_short" },
      },
    ],
    tips: [
      "Diffusez le lundi matin — les réponses sont plus réfléchies qu'à chaud.",
      "Croisez les résultats avec le pulse à chaud : l'écart vous dit si l'effet est durable ou superficiel.",
      "Partagez publiquement 2-3 verbatims marquants pour renforcer l'engagement collectif.",
    ],
  },

  /* ═══════════════════════════════════════════════
     COMPRÉHENSION DES MESSAGES (appropriation)
     ═══════════════════════════════════════════════ */
  {
    id: "appropriation.clarity_test",
    dimension: "appropriation",
    title: "Test de clarté des messages clés",
    context:
      "Pour vérifier que les messages stratégiques ont été compris et retenus — pas juste reçus. À envoyer 48h après l'action, quand la mémoire est encore fraîche mais filtrée.",
    timing: "j_plus_2",
    questions: [
      {
        id: "q1",
        text: "En une phrase, quel était selon vous le message principal de cette action ?",
        scale: { kind: "open_short" },
        required: true,
      },
      {
        id: "q2",
        text: "Ce message vous semble-t-il clair ?",
        scale: { kind: "likert_5", labels: ["Pas clair du tout", "Très clair"] },
        required: true,
      },
      {
        id: "q3",
        text: "Ce message vous semble-t-il utile / pertinent pour votre activité ?",
        scale: { kind: "likert_5", labels: ["Inutile", "Très utile"] },
        required: true,
      },
      {
        id: "q4",
        text: "Qu'attendez-vous concrètement de vous suite à ce message ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q5",
        text: "Y a-t-il un point qui vous semble flou ou contradictoire ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q6",
        text: "Avez-vous partagé ce message avec votre équipe ?",
        scale: { kind: "yes_no" },
      },
    ],
    tips: [
      "La question 1 est la plus importante : c'est elle qui révèle si le message est vraiment retenu (vs. paraphrasé).",
      "Analysez les verbatims à la recherche d'écarts par rapport au message officiel — chaque écart est un angle mort.",
      "Si < 60% des répondants savent reformuler le message, il faut relancer une communication ciblée.",
    ],
  },
  {
    id: "appropriation.manager_cascade",
    dimension: "appropriation",
    title: "Test de relais managérial",
    context:
      "Pour vérifier que la cascade de communication (top-down) a bien fonctionné. À envoyer J+7 aux collaborateurs qui n'ont PAS assisté directement à l'action — on mesure ce que leur manager leur a transmis.",
    timing: "j_plus_7",
    questions: [
      {
        id: "q1",
        text: "Votre manager vous a-t-il parlé de l'action ou des messages clés partagés récemment ?",
        scale: { kind: "yes_no" },
        required: true,
      },
      {
        id: "q2",
        text: "Si oui, pouvez-vous résumer en une phrase ce qui vous a été transmis ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q3",
        text: "Ce relais vous a-t-il semblé clair ?",
        scale: { kind: "likert_5", labels: ["Pas clair", "Très clair"] },
      },
      {
        id: "q4",
        text: "Vous sentez-vous aligné(e) avec ces messages dans votre activité quotidienne ?",
        scale: { kind: "likert_5", labels: ["Pas du tout", "Totalement"] },
        required: true,
      },
      {
        id: "q5",
        text: "Que souhaiteriez-vous savoir de plus ou plus clairement ?",
        scale: { kind: "open_short" },
      },
    ],
    tips: [
      "Ne pas envoyer aux participants directs — le test doit mesurer la cascade, pas la source.",
      "Comparez les verbatims entre équipes : si les formulations divergent fortement, la cascade dilue le message.",
      "Briefez les managers en amont la prochaine fois — 3 messages clés + 1 anecdote = formule gagnante.",
    ],
  },

  /* ═══════════════════════════════════════════════
     IMPACT
     ═══════════════════════════════════════════════ */
  {
    id: "impact.behavior_change_30",
    dimension: "impact",
    title: "Mesure de changement comportemental J+30",
    context:
      "Pour mesurer l'impact concret de l'action sur les pratiques, pas juste la satisfaction. À envoyer 30 jours après — la durée nécessaire pour qu'un comportement s'installe (ou pas).",
    timing: "j_plus_30",
    questions: [
      {
        id: "q1",
        text: "Depuis l'action, avez-vous changé concrètement votre façon de travailler sur ce sujet ?",
        scale: { kind: "yes_no" },
        required: true,
      },
      {
        id: "q2",
        text: "Si oui, qu'est-ce qui a changé ? (1-2 exemples concrets)",
        scale: { kind: "open_short" },
      },
      {
        id: "q3",
        text: "Sur une échelle de 1 à 10, quel impact cette action a-t-elle eu sur vos pratiques professionnelles ?",
        scale: { kind: "likert_10", labels: ["Aucun impact", "Impact majeur"] },
        required: true,
      },
      {
        id: "q4",
        text: "Avez-vous rencontré un frein dans la mise en application ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q5",
        text: "De quoi auriez-vous besoin pour aller plus loin dans le changement ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q6",
        text: "Recommanderiez-vous l'action à un collègue qui n'y a pas participé ?",
        scale: { kind: "likert_5", labels: ["Pas du tout", "Absolument"] },
        required: true,
      },
    ],
    tips: [
      "Attendez vraiment J+30 — à J+7 on mesure l'enthousiasme, à J+30 on mesure le changement.",
      "Les verbatims de la question 2 sont votre meilleure matière pour un rapport COMEX : chiffre + exemple concret.",
      "Si < 30% déclarent avoir changé, l'action a produit un effet de stimulation mais pas de transformation — prévoyez un relais.",
    ],
  },
  {
    id: "impact.alignment_check",
    dimension: "impact",
    title: "Check d'alignement stratégique",
    context:
      "Pour mesurer si l'action a réellement renforcé l'alignement de l'équipe avec la stratégie — au-delà de la simple satisfaction. À envoyer J+7, moment où les participants peuvent encore comparer avant/après.",
    timing: "j_plus_7",
    questions: [
      {
        id: "q1",
        text: "Avant cette action, à quel point vous sentiez-vous aligné(e) avec la stratégie sur ce sujet ?",
        scale: { kind: "likert_10", labels: ["Pas du tout", "Totalement"] },
        required: true,
      },
      {
        id: "q2",
        text: "Et aujourd'hui, après l'action ?",
        scale: { kind: "likert_10", labels: ["Pas du tout", "Totalement"] },
        required: true,
      },
      {
        id: "q3",
        text: "Qu'est-ce qui a concrètement fait évoluer votre niveau d'alignement ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q4",
        text: "Y a-t-il un point sur lequel vous restez en désaccord ou sceptique ?",
        scale: { kind: "open_short" },
      },
      {
        id: "q5",
        text: "Pouvez-vous expliquer cette stratégie à un nouveau collaborateur ?",
        scale: { kind: "yes_no" },
      },
    ],
    tips: [
      "L'écart q1 → q2 est votre vrai KPI d'impact — +2 points en moyenne = action réussie.",
      "Ne négligez pas la question 5 : si les gens ne peuvent pas l'expliquer, ils ne l'ont pas intériorisée.",
      "Remontez anonymisés les désaccords (q4) au COMEX — c'est une matière stratégique précieuse.",
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────── */

export function templatesForDimension(dim: Dimension): Template[] {
  return TEMPLATES.filter(t => t.dimension === dim);
}

/**
 * Retrouve la dimension visée par une recommandation à partir de son titre.
 * Les titres suivent le pattern `Accélérer la <label_métier>`.
 */
export function dimensionFromRecommendationTitle(title: string): Dimension | null {
  const t = title.toLowerCase();
  if (t.includes("mobilisation")) return "reach";
  if (t.includes("implication")) return "engagement";
  if (t.includes("compréhension") || t.includes("comprehension")) return "appropriation";
  if (t.includes("impact")) return "impact";
  return null;
}

/**
 * Idem mais à partir du `field` d'un data_gap ("compréhension des messages", etc.).
 */
export function dimensionFromGapField(field: string): Dimension | null {
  return dimensionFromRecommendationTitle(field);
}

/* ─────────────────────────────────────────────────────────────────────
   EXPORTS (formats de copie)
   ───────────────────────────────────────────────────────────────────── */

function scaleHint(q: TemplateQuestion): string {
  switch (q.scale.kind) {
    case "likert_5":
      return `Échelle 1-5 (${q.scale.labels[0]} → ${q.scale.labels[1]})`;
    case "likert_10":
      return `Échelle 1-10 (${q.scale.labels[0]} → ${q.scale.labels[1]})`;
    case "open_short":
      return "Réponse libre (1-2 phrases)";
    case "yes_no":
      return "Oui / Non";
    case "multiple_choice":
      return `Choix multiple : ${q.scale.options.join(" · ")}`;
  }
}

/** Export Markdown — idéal pour Notion, Slack, README. */
export function toMarkdown(tpl: Template): string {
  const lines: string[] = [];
  lines.push(`# ${tpl.title}`);
  lines.push("");
  lines.push(`**Timing :** ${TIMING_LABELS[tpl.timing]}`);
  lines.push("");
  lines.push(`> ${tpl.context}`);
  lines.push("");
  lines.push("## Questions");
  tpl.questions.forEach((q, i) => {
    lines.push(`${i + 1}. **${q.text}**${q.required ? " *(obligatoire)*" : ""}`);
    lines.push(`   - _${scaleHint(q)}_`);
  });
  lines.push("");
  lines.push("## Conseils d'utilisation");
  tpl.tips.forEach(tip => lines.push(`- ${tip}`));
  return lines.join("\n");
}

/** Export texte brut — copier-coller direct dans Google Forms / Typeform. */
export function toPlainText(tpl: Template): string {
  const lines: string[] = [];
  lines.push(tpl.title.toUpperCase());
  lines.push(`Timing : ${TIMING_LABELS[tpl.timing]}`);
  lines.push("");
  lines.push(tpl.context);
  lines.push("");
  tpl.questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.text}${q.required ? " *" : ""}`);
    lines.push(`   [${scaleHint(q)}]`);
    lines.push("");
  });
  lines.push("Conseils :");
  tpl.tips.forEach(tip => lines.push(`- ${tip}`));
  return lines.join("\n");
}
