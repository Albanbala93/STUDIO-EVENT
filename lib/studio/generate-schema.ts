/**
 * Schéma JSON strict pour la route /api/studio/generate.
 *
 * Mirroire 1:1 ce que le prompt demande, avec dircomView et eventCopilot
 * déclarés `required` — l'API OpenAI Responses (mode json_schema strict)
 * REFUSE de retourner si l'un de ces blocs est absent. Plus besoin de
 * compter sur la mention "obligatoire" dans le prompt — elle est ignorable
 * par les modèles plus légers (gpt-4.1-mini, gpt-4o-mini).
 *
 * Contraintes OpenAI strict mode :
 *   - chaque object doit avoir additionalProperties: false
 *   - chaque object doit lister TOUTES ses properties dans required
 *   - les enum strings sont supportés (impact, complexity, delay)
 */

const EVENT_FORMAT_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string" },
    format: { type: "string" },
    relevanceScore: { type: "integer", minimum: 1, maximum: 5 },
    whyRecommended: { type: "string" },
    expectedImpact: { type: "string" },
    usageContext: { type: "string" },
    implementationLevel: {
      type: "string",
      enum: ["léger", "intermédiaire", "structurant"],
    },
  },
  required: [
    "category",
    "format",
    "relevanceScore",
    "whyRecommended",
    "expectedImpact",
    "usageContext",
    "implementationLevel",
  ],
  additionalProperties: false,
} as const;

export const GENERATE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    communicationDiagnostic: { type: "string" },
    centralProblem: { type: "string" },
    strategicAngle: { type: "string" },
    deviceArchitecture: { type: "string" },
    keyMessages: { type: "array", items: { type: "string" } },
    recommendedFormats: { type: "array", items: { type: "string" } },
    quickWins: { type: "array", items: { type: "string" } },

    timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          when: { type: "string" },
          action: { type: "string" },
          impact: { type: "string", enum: ["élevé", "moyen", "faible"] },
          complexity: { type: "string", enum: ["élevé", "moyen", "faible"] },
          delay: {
            type: "string",
            enum: ["court terme", "moyen terme", "long terme"],
          },
          dependencies: { type: "array", items: { type: "string" } },
        },
        required: [
          "when",
          "action",
          "impact",
          "complexity",
          "delay",
          "dependencies",
        ],
        additionalProperties: false,
      },
    },

    generatedContent: {
      type: "object",
      properties: {
        executiveEmail: { type: "string" },
        intranetPost: { type: "string" },
        managerKit: { type: "string" },
        faq: { type: "string" },
      },
      required: ["executiveEmail", "intranetPost", "managerKit", "faq"],
      additionalProperties: false,
    },

    briefSpecificity: {
      type: "object",
      properties: {
        whatMakesThisCaseUnique: { type: "array", items: { type: "string" } },
        whyThisRecommendationFits: { type: "string" },
        whatWasDeliberatelyExcluded: { type: "array", items: { type: "string" } },
      },
      required: [
        "whatMakesThisCaseUnique",
        "whyThisRecommendationFits",
        "whatWasDeliberatelyExcluded",
      ],
      additionalProperties: false,
    },

    eventCopilot: {
      type: "object",
      properties: {
        strategicIntent: { type: "string" },
        primaryEventFormats: { type: "array", items: EVENT_FORMAT_SCHEMA },
        secondaryEventFormats: { type: "array", items: EVENT_FORMAT_SCHEMA },
        permanentCommunicationDevices: {
          type: "array",
          items: EVENT_FORMAT_SCHEMA,
        },
        recommendedMix: { type: "string" },
        whyTheseFormats: { type: "string" },
        eventRoleInStrategy: { type: "string" },
        beforePhase: { type: "string" },
        duringPhase: { type: "string" },
        afterPhase: { type: "string" },
        managerActivation: { type: "string" },
        participantExperience: { type: "string" },
        eventStorytelling: { type: "string" },
        watchouts: { type: "array", items: { type: "string" } },
        formatsToAvoid: { type: "array", items: { type: "string" } },
      },
      required: [
        "strategicIntent",
        "primaryEventFormats",
        "secondaryEventFormats",
        "permanentCommunicationDevices",
        "recommendedMix",
        "whyTheseFormats",
        "eventRoleInStrategy",
        "beforePhase",
        "duringPhase",
        "afterPhase",
        "managerActivation",
        "participantExperience",
        "eventStorytelling",
        "watchouts",
        "formatsToAvoid",
      ],
      additionalProperties: false,
    },

    dircomView: {
      type: "object",
      properties: {
        summary: { type: "string" },
        keyRisks: { type: "array", items: { type: "string" } },
        keyArbitrations: { type: "array", items: { type: "string" } },
        decisionsToMake: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "keyRisks", "keyArbitrations", "decisionsToMake"],
      additionalProperties: false,
    },
  },
  required: [
    "executiveSummary",
    "communicationDiagnostic",
    "centralProblem",
    "strategicAngle",
    "deviceArchitecture",
    "keyMessages",
    "recommendedFormats",
    "quickWins",
    "timeline",
    "generatedContent",
    "briefSpecificity",
    "eventCopilot",
    "dircomView",
  ],
  additionalProperties: false,
} as const;
