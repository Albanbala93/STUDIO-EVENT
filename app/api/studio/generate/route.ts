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
        model: process.env.OPENAI_MODEL || "gpt-4.1",
        input: prompt,
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

    let parsedOutput;

    try {
      parsedOutput = JSON.parse(rawText);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "JSON invalide", raw: rawText },
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