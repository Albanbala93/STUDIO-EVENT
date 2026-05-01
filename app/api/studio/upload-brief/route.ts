import { NextResponse } from "next/server";

// Cap interne sur la taille du fichier accepté (Vercel limite déjà à 4.5MB par défaut).
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB
// Cap sur le texte envoyé à OpenAI pour éviter de saturer le contexte avec un long PDF.
const MAX_EXTRACTED_CHARS = 24_000;

export const maxDuration = 30;

/**
 * Extrait le texte brut d'un fichier brief uploadé.
 * - .txt          → file.text() direct
 * - .pdf          → pdf-parse (Node.js)
 * - .docx         → mammoth (Node.js)
 * - .doc (legacy) → rejeté avec message clair (parsing fragile, conversion .docx recommandée)
 */
async function extractBriefText(file: File): Promise<{ text: string; error?: string }> {
  const fileName = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (fileName.endsWith(".txt") || file.type === "text/plain") {
    return { text: buffer.toString("utf8") };
  }

  if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      // Import dynamique : pdf-parse a un check de fichier de test au load,
      // l'import lazy évite de l'évaluer si la route n'est jamais appelée.
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      const text = (data.text ?? "").trim();
      if (!text) {
        return {
          text: "",
          error: "PDF sans texte extractible (probablement scanné ou image-only).",
        };
      }
      return { text };
    } catch (e) {
      console.error("[upload-brief] PDF parse failed:", e);
      return {
        text: "",
        error:
          "Impossible de lire ce PDF. Vérifiez qu'il n'est pas protégé par mot de passe, puis réessayez.",
      };
    }
  }

  if (
    fileName.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value ?? "").trim();
      if (!text) {
        return { text: "", error: "Document .docx vide ou illisible." };
      }
      return { text };
    } catch (e) {
      console.error("[upload-brief] DOCX parse failed:", e);
      return {
        text: "",
        error:
          "Impossible de lire ce .docx. Réessayez ou collez le contenu manuellement.",
      };
    }
  }

  if (fileName.endsWith(".doc")) {
    return {
      text: "",
      error:
        "Format .doc (Word ancien) non supporté. Convertissez en .docx ou .pdf.",
    };
  }

  return {
    text: "",
    error: `Format non supporté (${file.type || fileName}). Formats acceptés : PDF, DOCX, TXT.`,
  };
}

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

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 4 MB.`,
        },
        { status: 413 }
      );
    }

    const { text: rawText, error: extractError } = await extractBriefText(file);
    if (extractError) {
      return NextResponse.json(
        { success: false, error: extractError },
        { status: 400 }
      );
    }
    if (!rawText.trim()) {
      return NextResponse.json(
        { success: false, error: "Impossible de lire le contenu du fichier" },
        { status: 400 }
      );
    }

    // Tronque le texte avant envoi à OpenAI pour rester dans des limites raisonnables.
    const text =
      rawText.length > MAX_EXTRACTED_CHARS
        ? rawText.slice(0, MAX_EXTRACTED_CHARS)
        : rawText;

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
        // Brief structuré court (6 champs) — 2000 laisse de la marge pour des longs contextes.
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
        max_output_tokens: 2000,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ UPLOAD BRIEF OPENAI ERROR:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: "Erreur OpenAI",
          status: response.status,
          details: errorText.slice(0, 500),
        },
        { status: 500 }
      );
    }

    const payload = await response.json();

    if (payload.status === "incomplete") {
      const reason = payload.incomplete_details?.reason || "inconnu";
      console.error("❌ UPLOAD BRIEF INCOMPLETE:", reason);
      return NextResponse.json(
        {
          success: false,
          error:
            reason === "max_output_tokens"
              ? "Brief trop long pour être analysé d'un coup. Réessayez avec un document plus court."
              : `Réponse OpenAI incomplète (${reason})`,
        },
        { status: 500 }
      );
    }

    const rawOutput =
      payload.output_text ??
      payload.output?.[0]?.content?.[0]?.text ??
      payload.output?.[0]?.content?.[0]?.value ??
      null;

    if (!rawOutput) {
      return NextResponse.json(
        { success: false, error: "Réponse OpenAI vide", debug: payload },
        { status: 500 }
      );
    }

    console.log("🧠 UPLOAD BRIEF RAW OUTPUT:", rawOutput);

    const cleaned = String(rawOutput)
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let brief;
    try {
      brief = JSON.parse(cleaned);
    } catch (e) {
      const parseMessage = e instanceof Error ? e.message : String(e);
      console.error("❌ UPLOAD BRIEF JSON PARSE FAIL:", parseMessage);
      return NextResponse.json(
        {
          success: false,
          error: "JSON invalide",
          parseError: parseMessage,
          rawTail: cleaned.slice(-200),
        },
        { status: 500 }
      );
    }

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
