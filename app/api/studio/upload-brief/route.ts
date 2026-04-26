import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Fichier manquant" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    let text = "";

    // Version simple pour commencer
    // TXT marche directement
    // DOC/DOCX/PDF seront améliorés ensuite
    if (file.type === "text/plain" || fileName.endsWith(".txt")) {
      text = await file.text();
    } else {
      // Fallback simple temporaire
      text = await file.text();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, error: "Impossible de lire le contenu du fichier" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY manquante" },
        { status: 500 }
      );
    }

    const prompt = `
Tu es un consultant senior en communication interne et événementielle.

Tu reçois un brief brut rédigé par un client.
Ta mission est de l'analyser et d'en extraire un brief structuré.

RÈGLES :
- Tu dois rester fidèle au contenu du document
- Tu ne dois pas inventer des informations absentes
- Si une information est manquante, laisse une chaîne vide
- Reformule proprement quand nécessaire
- Retourne uniquement un JSON valide

DOCUMENT CLIENT :
${text}

Retourne exactement cette structure JSON :
{
  "companyContext": "string",
  "challenge": "string",
  "audience": "string",
  "objective": "string",
  "tone": "string",
  "constraints": "string"
}
`.trim();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Brief structuré court (6 champs) → cap par défaut 1500.
        model: process.env.OPENAI_MODEL || "gpt-4.1",
        input: [
          {
            role: "system",
            content:
              "Tu es un expert en analyse de brief. Tu retournes uniquement du JSON valide.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_output_tokens: 1500,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ UPLOAD BRIEF OPENAI ERROR:", errorText);

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

    console.log("🧠 UPLOAD BRIEF RAW OUTPUT:", rawText);

    const brief = JSON.parse(rawText);

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error) {
    console.error("❌ UPLOAD BRIEF ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur serveur",
      },
      { status: 500 }
    );
  }
}