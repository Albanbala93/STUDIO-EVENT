import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("🔥 ROUTE GENERATE APPELÉE");

    const body = await req.json();

    const {
      companyContext = "",
      challenge = "",
      audience = "",
      objective = "",
      tone = "",
      constraints = "",
    } = body;

    if (
      !companyContext ||
      !challenge ||
      !audience ||
      !objective ||
      !tone ||
      !constraints
    ) {
      return NextResponse.json(
        { success: false, error: "Brief incomplet" },
        { status: 400 }
      );
    }

    console.log("🧾 BRIEF REÇU:", body);

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY manquante" },
        { status: 500 }
      );
    }

    // ===============================
    // 🧠 PROMPT PRINCIPAL
    // ===============================

    const prompt = `
Tu es un consultant senior en communication interne et événementielle.

Ta mission :
produire une recommandation STRATÉGIQUE PREMIUM, totalement personnalisée au brief.

BRIEF :
- Contexte : ${companyContext}
- Problématique : ${challenge}
- Audience : ${audience}
- Objectif : ${objective}
- Ton : ${tone}
- Contraintes : ${constraints}

RÈGLES OBLIGATOIRES :
- Chaque section doit être spécifique au brief
- Tu dois choisir un scénario principal clair
- Tu dois éviter toute réponse générique
- Tu dois justifier les choix
- Tu dois exclure les options non pertinentes

Le bloc "eventCopilot" est obligatoire.
Le bloc "dircomView" est obligatoire.
Le bloc "timeline" est obligatoire et NE DOIT JAMAIS être vide.

RÈGLES POUR "timeline" (plan de déploiement) :
- Produis 6 à 10 étapes ordonnées chronologiquement, du lancement à la post-évaluation
- Chaque étape doit être une action concrète, opérationnelle, ancrée dans le brief — jamais une généralité
- Le champ "when" doit être un repère temporel parlant : "S-2", "J-7", "Jour J", "S+1", "S+2", "M+1", "M+3", "M+6", etc.
- Le champ "action" doit décrire UNE seule action (verbe d'action en tête), 1 phrase max
- Le champ "impact" reflète l'effet attendu sur l'audience/objectif : "élevé" | "moyen" | "faible"
- Le champ "complexity" reflète l'effort de mise en œuvre : "élevé" | "moyen" | "faible"
- Le champ "delay" qualifie l'horizon : "court terme" | "moyen terme" | "long terme"
- Le champ "dependencies" liste les prérequis explicites (rôles, livrables, validations) — peut être [] si aucun
- Couvre les 3 phases : amorçage (avant), activation (pendant), ancrage (après)

Retourne un JSON valide avec cette structure exacte :

{
  "executiveSummary": "string",
  "communicationDiagnostic": "string",
  "centralProblem": "string",
  "strategicAngle": "string",
  "deviceArchitecture": "string",
  "keyMessages": ["string", "string", "string"],
  "recommendedFormats": ["string", "string"],
  "quickWins": ["string", "string", "string"],

  "timeline": [
    {
      "when": "string",
      "action": "string",
      "impact": "élevé",
      "complexity": "moyen",
      "delay": "court terme",
      "dependencies": ["string"]
    }
  ],

  "generatedContent": {
    "executiveEmail": "string",
    "intranetPost": "string",
    "managerKit": "string",
    "faq": "string"
  },

  "briefSpecificity": {
    "whatMakesThisCaseUnique": ["string", "string", "string"],
    "whyThisRecommendationFits": "string",
    "whatWasDeliberatelyExcluded": ["string", "string"]
  },

  "eventCopilot": {
    "strategicIntent": "string",
    "primaryEventFormats": [
      {
        "category": "string",
        "format": "string",
        "relevanceScore": 1,
        "whyRecommended": "string",
        "expectedImpact": "string",
        "usageContext": "string",
        "implementationLevel": "léger"
      }
    ],
    "secondaryEventFormats": [
      {
        "category": "string",
        "format": "string",
        "relevanceScore": 1,
        "whyRecommended": "string",
        "expectedImpact": "string",
        "usageContext": "string",
        "implementationLevel": "léger"
      }
    ],
    "permanentCommunicationDevices": [
      {
        "category": "string",
        "format": "string",
        "relevanceScore": 1,
        "whyRecommended": "string",
        "expectedImpact": "string",
        "usageContext": "string",
        "implementationLevel": "léger"
      }
    ],
    "recommendedMix": "string",
    "whyTheseFormats": "string",
    "eventRoleInStrategy": "string",
    "beforePhase": "string",
    "duringPhase": "string",
    "afterPhase": "string",
    "managerActivation": "string",
    "participantExperience": "string",
    "eventStorytelling": "string",
    "watchouts": ["string", "string"],
    "formatsToAvoid": ["string", "string"]
  },

  "dircomView": {
    "summary": "string",
    "keyRisks": ["string", "string", "string"],
    "keyArbitrations": ["string", "string", "string"],
    "decisionsToMake": ["string", "string", "string"]
  }
}
`.trim();

    console.log("🚀 APPEL OPENAI");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Recommandation stratégique complète : JSON volumineux (timeline 6-10 + eventCopilot
        // avec 3 arrays de formats + generatedContent 4 longues sections + dircomView).
        // Cap à 8000 — un cap inférieur tronque la sortie et casse JSON.parse ("JSON invalide").
        model: process.env.OPENAI_MODEL || "gpt-4.1",
        input: prompt,
        max_output_tokens: 8000,
        text: {
          format: { type: "json_object" },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OPENAI ERROR:", errorText);

      return NextResponse.json(
        { success: false, error: "Erreur OpenAI", details: errorText },
        { status: 500 }
      );
    }

    const payload = await response.json();

    // Détection de troncature : la Responses API renvoie status="incomplete"
    // avec incomplete_details.reason="max_output_tokens" si la sortie est coupée.
    if (payload.status === "incomplete") {
      const reason = payload.incomplete_details?.reason || "inconnu";
      console.error("❌ OPENAI INCOMPLETE:", reason);
      return NextResponse.json(
        {
          success: false,
          error:
            reason === "max_output_tokens"
              ? "Sortie OpenAI tronquée (max_output_tokens trop bas)"
              : `Sortie OpenAI incomplète (${reason})`,
        },
        { status: 500 }
      );
    }

    const rawText =
      payload.output_text ??
      payload.output?.[0]?.content?.[0]?.text ??
      payload.output?.[0]?.content?.[0]?.value ??
      null;

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: "Réponse OpenAI vide", debug: payload },
        { status: 500 }
      );
    }

    console.log("🧠 RAW OUTPUT:", rawText);

    // Défense : certains modèles enveloppent le JSON dans ```json … ``` malgré le format json_object.
    const cleaned = rawText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let parsedOutput;

    try {
      parsedOutput = JSON.parse(cleaned);
    } catch (e) {
      const parseMessage = e instanceof Error ? e.message : String(e);
      console.error("❌ JSON PARSE FAIL:", parseMessage);
      console.error("❌ RAW LENGTH:", cleaned.length);
      console.error("❌ RAW TAIL:", cleaned.slice(-200));
      return NextResponse.json(
        {
          success: false,
          error: "JSON invalide",
          parseError: parseMessage,
          rawLength: cleaned.length,
          rawTail: cleaned.slice(-200),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      title: "Recommandation stratégique",
      output: parsedOutput,
    });

  } catch (error) {
    console.error("❌ ERREUR API :", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur serveur",
      },
      { status: 500 }
    );
  }
}