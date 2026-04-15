export type EventIntensity = "low" | "medium" | "high";
export type ManagerialRole = "light" | "moderate" | "strong";

export type BeforeDuringAfterPatterns = {
  before: string[];
  during: string[];
  after: string[];
};

export type EventStrategyProfile = {
  key: string;
  dominantRegister: string;
  description: string;
  strategicIntent: string;

  primaryFormats: string[];
  secondaryFormats: string[];
  discouragedFormats: string[];
  formatsToAvoid: string[];

  mustHaveElements: string[];

  emotionalLevel: EventIntensity;
  symbolicLevel: EventIntensity;
  collectiveIntensity: EventIntensity;

  managerialRole: ManagerialRole;
  leadershipVisibility: EventIntensity;

  successSignals: string[];
  risks: string[];

  indicativeKeywords: string[];

  recommendedNarrative: string;
  toneGuidelines: string[];
  managerActivationPatterns: string[];
  beforeDuringAfterPatterns: BeforeDuringAfterPatterns;
};

export const eventStrategyProfiles: Record<string, EventStrategyProfile> = {
  celebration_symbolic: {
    key: "celebration_symbolic",
    dominantRegister: "Célébration & fierté collective",
    description:
      "Valoriser l’histoire de l’entreprise, créer un moment de fierté partagée et projeter le collectif dans la suite de son histoire.",
    strategicIntent:
      "Faire de l’événement un temps fédérateur, symbolique et émotionnel, centré sur la reconnaissance, la mémoire et la projection.",
    primaryFormats: [
      "soirée anniversaire fédératrice",
      "gala interne",
      "cérémonie collective",
      "événement réunissant l’ensemble des collaborateurs",
    ],
    secondaryFormats: [
      "vidéos témoignages",
      "mini-site anniversaire",
      "exposition rétrospective",
      "timeline des moments clés",
      "livre souvenir ou manifeste d’avenir",
      "capsules éditoriales avant / après",
    ],
    discouragedFormats: [
      "séminaire de lancement",
      "atelier de transformation",
      "workshop process",
      "change lab",
      "atelier d’alignement opérationnel",
    ],
    formatsToAvoid: [
      "séminaire de lancement d’une demi-journée",
      "atelier de travail centré process",
      "session purement pédagogique",
      "format trop institutionnel sans émotion",
    ],
    mustHaveElements: [
      "rassemblement large",
      "moment symbolique fort",
      "reconnaissance collective",
      "projection vers l’avenir",
    ],
    emotionalLevel: "high",
    symbolicLevel: "high",
    collectiveIntensity: "high",
    managerialRole: "light",
    leadershipVisibility: "high",
    successSignals: [
      "fierté collective",
      "sentiment d’appartenance",
      "émotion partagée",
      "projection positive",
    ],
    risks: [
      "événement trop institutionnel",
      "absence de narration",
      "manque d’émotion",
      "format trop pédagogique",
    ],
    indicativeKeywords: [
      "anniversaire",
      "30 ans",
      "40 ans",
      "50 ans",
      "célébration",
      "celebration",
      "commémoration",
      "fierté",
      "héritage",
      "histoire",
      "reconnaissance",
    ],
    recommendedNarrative:
      "Célébrer le chemin parcouru, rendre hommage à ceux qui l’ont construit et ouvrir collectivement le prochain chapitre.",
    toneGuidelines: [
      "chaleureux",
      "fédérateur",
      "incarné",
      "valorisant",
      "émotion maîtrisée",
    ],
    managerActivationPatterns: [
      "relayer la fierté et le sens de l’événement auprès des équipes",
      "faire remonter des témoignages ou souvenirs en amont",
      "animer un temps d’échange léger après l’événement",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "teasing sur l’histoire et les temps forts de l’entreprise",
        "collecte de témoignages, souvenirs, visuels ou anecdotes",
        "mise en attente positive autour du moment anniversaire",
      ],
      during: [
        "moment symbolique fort et collectif",
        "prise de parole incarnée de la direction",
        "séquence de reconnaissance ou d’hommage",
        "projection vers l’avenir",
      ],
      after: [
        "relais éditoriaux avec photos, vidéos, extraits",
        "valorisation des messages clés et de la projection",
        "prolongement du sentiment d’appartenance",
      ],
    },
  },

  transformation_alignment: {
    key: "transformation_alignment",
    dominantRegister: "Alignement & projection stratégique",
    description:
      "Faire comprendre le cap, créer l’alignement et organiser l’appropriation d’une transformation ou d’un nouveau plan stratégique.",
    strategicIntent:
      "Faire de l’événement un temps d’incarnation du cap, puis structurer des relais d’appropriation managériaux et opérationnels.",
    primaryFormats: [
      "séminaire stratégique",
      "convention interne",
      "town hall de direction",
    ],
    secondaryFormats: [
      "workshops de transformation",
      "sessions Q&A",
      "kits managers",
      "formats hybrides de déploiement",
      "webinaires de suivi",
    ],
    discouragedFormats: [
      "événement purement festif",
      "afterwork seul",
      "cérémonie symbolique seule",
    ],
    formatsToAvoid: [
      "format uniquement célébratif",
      "événement sans cap clair",
      "séquence descendante sans appropriation",
    ],
    mustHaveElements: [
      "incarnation du cap",
      "alignement collectif",
      "projection claire",
      "relais managérial",
    ],
    emotionalLevel: "medium",
    symbolicLevel: "medium",
    collectiveIntensity: "high",
    managerialRole: "strong",
    leadershipVisibility: "high",
    successSignals: [
      "compréhension du cap",
      "alignement inter-équipes",
      "adhésion",
      "capacité à relayer",
    ],
    risks: [
      "discours trop abstrait",
      "manque d’incarnation",
      "absence de relais terrain",
      "sur-promesse sans mise en œuvre",
    ],
    indicativeKeywords: [
      "transformation",
      "plan stratégique",
      "nouvelle stratégie",
      "vision",
      "cap",
      "alignement",
      "réorganisation",
      "nouvelle organisation",
      "feuille de route",
    ],
    recommendedNarrative:
      "Donner du sens au changement, clarifier la trajectoire et montrer comment chacun contribue à la suite.",
    toneGuidelines: [
      "clair",
      "structurant",
      "engageant",
      "pédagogique",
      "direct",
    ],
    managerActivationPatterns: [
      "organiser des points managers avant le temps collectif",
      "fournir des éléments de langage et un kit de relai",
      "prévoir des temps de débrief équipe après l’événement",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "préparer les managers et sponsors",
        "clarifier les messages critiques",
        "anticiper les questions et irritants",
      ],
      during: [
        "prise de parole incarnée de la direction",
        "temps de clarification et d’alignement",
        "Q&A ou interaction structurée",
      ],
      after: [
        "relais managers",
        "formats d’appropriation ciblés",
        "suivi éditorial des prochaines étapes",
      ],
    },
  },

  inauguration_showcase: {
    key: "inauguration_showcase",
    dominantRegister: "Valorisation & vitrine",
    description:
      "Mettre en scène un lieu, un campus, un site ou une nouvelle étape visible de l’entreprise.",
    strategicIntent:
      "Faire de l’événement une vitrine, à la fois institutionnelle et expérientielle, qui valorise le lieu et ce qu’il représente.",
    primaryFormats: [
      "événement d’inauguration officiel",
      "visite immersive du site",
      "événement réunissant partenaires, invités et collaborateurs",
    ],
    secondaryFormats: [
      "parcours expérientiel",
      "prises de parole institutionnelles",
      "démonstrations sur site",
      "capsules photo / vidéo",
      "contenus éditoriaux de valorisation",
    ],
    discouragedFormats: [
      "workshop de transformation",
      "séminaire stratégique pur",
      "atelier collaboratif sans mise en valeur du lieu",
    ],
    formatsToAvoid: [
      "réunion d’information classique",
      "format sans parcours ou scénographie",
      "dispositif trop théorique",
    ],
    mustHaveElements: [
      "mise en valeur du lieu",
      "moment officiel",
      "expérience visiteur",
      "dimension vitrine",
    ],
    emotionalLevel: "medium",
    symbolicLevel: "high",
    collectiveIntensity: "medium",
    managerialRole: "moderate",
    leadershipVisibility: "high",
    successSignals: [
      "effet de découverte",
      "fierté",
      "valorisation du site",
      "bonne perception interne et externe",
    ],
    risks: [
      "événement trop froid",
      "parcours peu lisible",
      "absence d’expérience mémorable",
    ],
    indicativeKeywords: [
      "inauguration",
      "nouveau site",
      "nouveau bâtiment",
      "campus",
      "ouverture",
      "nouveaux locaux",
    ],
    recommendedNarrative:
      "Montrer plus qu’un lieu : montrer ce qu’il rend possible et ce qu’il dit de l’entreprise.",
    toneGuidelines: [
      "premium",
      "valorisant",
      "institutionnel mais vivant",
      "clair",
    ],
    managerActivationPatterns: [
      "préparer les relais internes à expliquer le lieu et ses usages",
      "mettre les managers en situation d’ambassadeurs",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "annoncer le sens de l’inauguration et les messages clés",
        "préparer les parcours et prises de parole",
      ],
      during: [
        "mise en scène du lieu",
        "moment officiel",
        "expérience guidée ou immersive",
      ],
      after: [
        "relais photo / vidéo / contenus éditoriaux",
        "ancrage des messages autour du site et de son rôle",
      ],
    },
  },

  relocation_transition: {
    key: "relocation_transition",
    dominantRegister: "Transition & appropriation",
    description:
      "Accompagner un déménagement ou un changement de lieu en aidant les équipes à s’approprier les nouveaux espaces.",
    strategicIntent:
      "Faire du déménagement un moment de transition positive et d’appropriation plutôt qu’un simple changement logistique.",
    primaryFormats: [
      "journée d’appropriation du nouveau site",
      "événement de découverte des nouveaux espaces",
      "moment collectif de transition",
    ],
    secondaryFormats: [
      "visites guidées",
      "kits d’accueil",
      "signalétique explicative",
      "animations de découverte",
      "activation managers",
    ],
    discouragedFormats: [
      "séminaire stratégique pur",
      "événement festif déconnecté du lieu",
    ],
    formatsToAvoid: [
      "format uniquement logistique",
      "communication sans accompagnement humain",
      "temps collectif sans explication des usages",
    ],
    mustHaveElements: [
      "appropriation des lieux",
      "accompagnement du changement",
      "explication des usages",
    ],
    emotionalLevel: "medium",
    symbolicLevel: "medium",
    collectiveIntensity: "medium",
    managerialRole: "moderate",
    leadershipVisibility: "medium",
    successSignals: [
      "prise en main rapide",
      "réduction des irritants",
      "adhésion au nouveau cadre",
    ],
    risks: [
      "désorientation",
      "résistance au changement",
      "manque de repères pratiques",
    ],
    indicativeKeywords: [
      "déménagement",
      "demenagement",
      "nouveaux bureaux",
      "nouveaux locaux",
      "emménagement",
      "nouvel espace",
    ],
    recommendedNarrative:
      "Faire du nouveau lieu un repère commun, compris et progressivement approprié par tous.",
    toneGuidelines: [
      "rassurant",
      "pratique",
      "positif",
      "facilitateur",
    ],
    managerActivationPatterns: [
      "préparer les managers à répondre aux questions pratiques",
      "organiser des temps d’appropriation en équipe",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "préparer les repères logistiques et humains",
        "anticiper les irritants et questions fréquentes",
      ],
      during: [
        "faire découvrir les lieux et leurs usages",
        "faciliter la prise en main collective",
      ],
      after: [
        "relais pratiques",
        "ajustements",
        "boucles de feedback terrain",
      ],
    },
  },

  engagement_culture: {
    key: "engagement_culture",
    dominantRegister: "Engagement & adhésion",
    description:
      "Créer de l’implication, de l’écoute et de la participation autour d’un sujet culturel, managérial ou collectif.",
    strategicIntent:
      "Créer un dispositif où les équipes ne reçoivent pas seulement un message, mais participent à l’adhésion et à l’appropriation.",
    primaryFormats: [
      "séminaire d’engagement",
      "atelier participatif large",
      "événement fédérateur avec interaction",
    ],
    secondaryFormats: [
      "groupes de discussion",
      "formats collaboratifs",
      "ambassadeurs internes",
      "rituels collectifs",
      "baromètres et boucles de feedback",
    ],
    discouragedFormats: [
      "format purement descendant",
      "événement trop institutionnel",
      "prise de parole sans interaction",
    ],
    formatsToAvoid: [
      "discours long sans participation",
      "événement très top-down",
      "dispositif sans écoute",
    ],
    mustHaveElements: [
      "participation",
      "écoute",
      "co-construction",
    ],
    emotionalLevel: "high",
    symbolicLevel: "medium",
    collectiveIntensity: "high",
    managerialRole: "strong",
    leadershipVisibility: "medium",
    successSignals: [
      "participation active",
      "adhésion",
      "expression des équipes",
      "appropriation réelle",
    ],
    risks: [
      "effet cosmétique",
      "manque d’authenticité",
      "participation de façade",
    ],
    indicativeKeywords: [
      "engagement",
      "valeurs",
      "culture",
      "adhésion",
      "mobiliser",
      "embarquer",
      "participation",
      "co-construction",
    ],
    recommendedNarrative:
      "Faire émerger une dynamique collective sincère, où chacun peut se reconnaître et contribuer.",
    toneGuidelines: [
      "authentique",
      "mobilisateur",
      "participatif",
      "incarné",
    ],
    managerActivationPatterns: [
      "prévoir des espaces d’écoute et de relai managérial",
      "équiper les managers pour animer les échanges",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "faire émerger attentes et irritants",
        "préparer les managers au rôle d’écoute et de relai",
      ],
      during: [
        "favoriser la participation active",
        "faire vivre des temps d’expression ou de contribution",
      ],
      after: [
        "montrer ce qui a été retenu",
        "organiser des suites visibles",
        "tenir les engagements exprimés",
      ],
    },
  },

  onboarding_integration: {
    key: "onboarding_integration",
    dominantRegister: "Intégration & acculturation",
    description:
      "Accueillir, intégrer et mettre en relation de nouveaux collaborateurs avec leur environnement de travail.",
    strategicIntent:
      "Créer un parcours d’intégration lisible, chaleureux et utile, qui facilite l’appropriation rapide de l’environnement.",
    primaryFormats: [
      "journée d’accueil",
      "parcours d’onboarding",
      "rencontres structurées",
    ],
    secondaryFormats: [
      "buddy / sponsor event",
      "webinaires de prise en main",
      "kits onboarding",
      "drops de communication",
      "e-learning",
    ],
    discouragedFormats: [
      "événement unique sans suivi",
      "format uniquement institutionnel",
    ],
    formatsToAvoid: [
      "accueil trop théorique",
      "format dense sans mise en relation",
      "one-shot sans parcours",
    ],
    mustHaveElements: [
      "parcours structuré",
      "moments de rencontre",
      "compréhension de l’environnement",
    ],
    emotionalLevel: "medium",
    symbolicLevel: "low",
    collectiveIntensity: "medium",
    managerialRole: "moderate",
    leadershipVisibility: "low",
    successSignals: [
      "prise de repères",
      "intégration rapide",
      "compréhension des rôles et outils",
    ],
    risks: [
      "désengagement initial",
      "manque de repères",
      "accueil trop froid ou trop dense",
    ],
    indicativeKeywords: [
      "onboarding",
      "intégration",
      "integration",
      "nouveaux arrivants",
      "accueil",
      "nouveaux collaborateurs",
      "prise de poste",
    ],
    recommendedNarrative:
      "Permettre aux nouveaux arrivants de comprendre rapidement où ils arrivent, avec qui ils vont travailler et comment réussir.",
    toneGuidelines: [
      "chaleureux",
      "clair",
      "structurant",
      "pratique",
    ],
    managerActivationPatterns: [
      "préparer les managers à accueillir et suivre les nouveaux arrivants",
      "clarifier les rôles de buddy / sponsor / manager",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "préparer les repères, contenus et contacts utiles",
        "clarifier les rôles des interlocuteurs clés",
      ],
      during: [
        "combiner information utile et rencontres humaines",
        "montrer l’organisation, la culture et les outils",
      ],
      after: [
        "prévoir des points de suivi",
        "prolonger avec des ressources et relais utiles",
      ],
    },
  },

  commercial_mobilization: {
    key: "commercial_mobilization",
    dominantRegister: "Performance & mobilisation",
    description:
      "Créer une dynamique d’énergie, de clarté et d’engagement autour d’objectifs commerciaux ou d’un lancement.",
    strategicIntent:
      "Faire de l’événement un accélérateur de mobilisation, de clarté business et d’énergie collective.",
    primaryFormats: [
      "kick-off commercial",
      "séminaire de lancement",
      "événement de mobilisation",
    ],
    secondaryFormats: [
      "sales challenge",
      "cas clients internes",
      "simulations",
      "séquences inspirationnelles",
      "temps de reconnaissance des performances",
    ],
    discouragedFormats: [
      "format purement institutionnel",
      "prise de parole sans dynamique",
      "réunion longue sans activation",
    ],
    formatsToAvoid: [
      "réunion descendante sans mobilisation",
      "format trop froid",
      "absence de dynamique de performance",
    ],
    mustHaveElements: [
      "énergie",
      "objectifs clairs",
      "mobilisation",
    ],
    emotionalLevel: "high",
    symbolicLevel: "medium",
    collectiveIntensity: "high",
    managerialRole: "strong",
    leadershipVisibility: "high",
    successSignals: [
      "motivation",
      "clarté des objectifs",
      "dynamique collective",
      "appropriation des messages",
    ],
    risks: [
      "manque d’énergie",
      "discours trop descendant",
      "faible ancrage opérationnel",
    ],
    indicativeKeywords: [
      "kick-off",
      "commercial",
      "ventes",
      "lancement produit",
      "objectif commercial",
      "mobilisation commerciale",
      "sales",
    ],
    recommendedNarrative:
      "Créer un élan collectif clair, énergique et directement orienté vers la performance et l’exécution.",
    toneGuidelines: [
      "énergique",
      "direct",
      "mobilisateur",
      "orienté résultats",
    ],
    managerActivationPatterns: [
      "préparer les managers commerciaux à relayer les objectifs et le rythme attendu",
      "prévoir des relances de mobilisation après l’événement",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "préparer les objectifs et messages de mobilisation",
        "identifier les preuves, cas et succès à partager",
      ],
      during: [
        "rythmer le temps fort",
        "mettre en scène les objectifs, preuves et énergies",
      ],
      after: [
        "relancer la dynamique",
        "suivre les engagements",
        "ancrer les messages dans l’action commerciale",
      ],
    },
  },

  crisis_reassurance: {
    key: "crisis_reassurance",
    dominantRegister: "Clarté & réassurance",
    description:
      "Informer vite, rassurer, clarifier et maintenir la confiance dans un contexte de tension ou de crise.",
    strategicIntent:
      "Faire primer la clarté, la régularité et l’accessibilité sur toute logique événementielle trop ambitieuse ou spectaculaire.",
    primaryFormats: [
      "briefings courts",
      "webinaires de situation",
      "points réguliers d’information",
    ],
    secondaryFormats: [
      "FAQ centralisée",
      "messages réguliers",
      "réunions managériales",
      "micro-site de crise",
    ],
    discouragedFormats: [
      "événement festif",
      "format long ou complexe",
      "dispositif trop spectaculaire",
    ],
    formatsToAvoid: [
      "grand événement scénarisé",
      "temps trop long",
      "format ambigu ou trop émotionnel",
    ],
    mustHaveElements: [
      "rapidité",
      "clarté",
      "répétition",
      "accessibilité de l’information",
    ],
    emotionalLevel: "high",
    symbolicLevel: "low",
    collectiveIntensity: "medium",
    managerialRole: "strong",
    leadershipVisibility: "high",
    successSignals: [
      "apaisement",
      "compréhension",
      "réduction des rumeurs",
      "confiance",
    ],
    risks: [
      "flou",
      "retard",
      "contradictions de messages",
      "perte de confiance",
    ],
    indicativeKeywords: [
      "crise",
      "urgence",
      "incident",
      "rumeur",
      "risque réputationnel",
      "restructuration sensible",
      "fermeture",
      "conflit",
    ],
    recommendedNarrative:
      "Maintenir la confiance grâce à une information lisible, accessible et régulière.",
    toneGuidelines: [
      "sobre",
      "direct",
      "rassurant",
      "factuel",
    ],
    managerActivationPatterns: [
      "équiper les managers pour relayer les messages sans déformation",
      "prévoir des points de clarification courts et fréquents",
    ],
    beforeDuringAfterPatterns: {
      before: [
        "préparer les messages critiques",
        "aligner les relais",
        "sécuriser la FAQ",
      ],
      during: [
        "donner une information claire, courte et accessible",
        "ouvrir un canal de questions si pertinent",
      ],
      after: [
        "mettre à jour régulièrement",
        "corriger les zones de flou",
        "maintenir la confiance",
      ],
    },
  },
};

export const eventStrategyProfileKeys = Object.keys(eventStrategyProfiles);

export function getEventStrategyProfile(
  key: string,
): EventStrategyProfile | null {
  return eventStrategyProfiles[key] ?? null;
}