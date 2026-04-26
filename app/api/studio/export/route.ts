import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  TextRun,
} from "docx";

import type { EventFormatRecommendation, RiskItem, StudioProject } from "../../../../lib/studio/types";

// Allow up to 10MB body and 60s execution for large exports
export const maxDuration = 60;

type ExportRequest = {
  format: "pdf" | "docx";
  project: StudioProject;
};

function sanitizePdfText(text: string): string {
  return (text || "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/•/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "");
}

function safeFilename(name: string) {
  return (name || "campaign-studio")
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function wrapText(text: string, maxChars = 92): string[] {
  const paragraphs = sanitizePdfText(text).split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of paragraph.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxChars) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) lines.push(current);
  }

  return lines;
}

function projectDate() {
  return new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function valueOrFallback(value?: string) {
  return value?.trim() || "Non renseigné";
}

/* Shared category labels (ASCII-safe for PDF embedding) */
const CATEGORY_LABELS_PDF: Record<string, string> = {
  "sensibilisation-changement": "Sensibilisation au changement",
  "mise-en-oeuvre": "Mise en oeuvre operationnelle",
  "nouvelle-organisation": "Nouvelle organisation",
  "onboarding": "Onboarding & integration",
  "communication-crise": "Communication de crise",
  "engagement-commercial": "Engagement commercial",
  "celebration-reconnaissance": "Celebration & reconnaissance",
  "dispositifs-permanents": "Dispositifs permanents",
};

/* Full French labels for DOCX (Unicode supported) */
const CATEGORY_LABELS_DOCX: Record<string, string> = {
  "sensibilisation-changement": "Sensibilisation au changement",
  "mise-en-oeuvre": "Mise en œuvre opérationnelle",
  "nouvelle-organisation": "Nouvelle organisation",
  "onboarding": "Onboarding & intégration",
  "communication-crise": "Communication de crise",
  "engagement-commercial": "Engagement commercial",
  "celebration-reconnaissance": "Célébration & reconnaissance",
  "dispositifs-permanents": "Dispositifs permanents",
};

/* =========================
   PDF PREMIUM
========================= */

async function buildPremiumPdf(project: StudioProject): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    navy: rgb(0.059, 0.086, 0.161),
    blue: rgb(0.118, 0.251, 0.686),
    blueLight: rgb(0.937, 0.953, 1.0),
    blueMedium: rgb(0.859, 0.902, 1.0),
    text: rgb(0.067, 0.094, 0.153),
    muted: rgb(0.392, 0.447, 0.541),
    border: rgb(0.886, 0.902, 0.925),
    white: rgb(1, 1, 1),
    riskHigh: rgb(0.863, 0.149, 0.149),
    riskMedium: rgb(0.851, 0.467, 0.024),
    riskLow: rgb(0.020, 0.588, 0.416),
    success: rgb(0.020, 0.588, 0.416),
    indigo: rgb(0.310, 0.275, 0.898),
  };

  let page = pdfDoc.addPage([595.28, 841.89]);
  let { width, height } = page.getSize();

  const marginX = 52;
  const marginTop = 52;
  const marginBottom = 52;
  let y = height - marginTop;
  let pageNumber = 1;

  function addPage() {
    page = pdfDoc.addPage([595.28, 841.89]);
    ({ width, height } = page.getSize());
    y = height - marginTop;
    pageNumber += 1;
  }

  function drawFooter() {
    const footerY = 24;
    page.drawLine({
      start: { x: marginX, y: footerY + 12 },
      end: { x: width - marginX, y: footerY + 12 },
      thickness: 0.5,
      color: colors.border,
    });
    page.drawText("Stratly · Campaign — Confidentiel", {
      x: marginX,
      y: footerY,
      size: 8,
      font: fontRegular,
      color: colors.muted,
    });
    page.drawText(String(pageNumber), {
      x: width - marginX - 6,
      y: footerY,
      size: 8,
      font: fontRegular,
      color: colors.muted,
    });
  }

  function ensureSpace(requiredHeight: number) {
    if (y - requiredHeight < marginBottom + 20) {
      drawFooter();
      addPage();
    }
  }

  function drawSpacer(space = 10) {
    y -= space;
  }

  function drawParagraph(
    text: string,
    opts?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; lineGap?: number; x?: number; maxWidth?: number }
  ) {
    const lines = wrapText(text, Math.floor(((opts?.maxWidth ?? width - marginX * 2) / 7)));
    const size = opts?.size ?? 10.5;
    const lineGap = opts?.lineGap ?? 5;

    for (const line of lines) {
      ensureSpace(size + lineGap + 2);
      if (!line.trim()) {
        y -= size;
        continue;
      }
      page.drawText(line, {
        x: opts?.x ?? marginX,
        y,
        size,
        font: opts?.bold ? fontBold : fontRegular,
        color: opts?.color ?? colors.text,
        maxWidth: opts?.maxWidth ?? width - marginX * 2,
      });
      y -= size + lineGap;
    }
  }

  function drawSectionTitle(index: string, title: string) {
    ensureSpace(36);
    page.drawRectangle({
      x: marginX,
      y: y - 10,
      width: width - marginX * 2,
      height: 28,
      color: colors.navy,
      borderWidth: 0,
    });
    page.drawText(`${index}  ${sanitizePdfText(title).toUpperCase()}`, {
      x: marginX + 12,
      y: y - 2,
      size: 10,
      font: fontBold,
      color: colors.white,
      maxWidth: width - marginX * 2 - 24,
    });
    y -= 38;
  }

  function drawSubtitle(text: string) {
    ensureSpace(22);
    page.drawText(sanitizePdfText(text), {
      x: marginX,
      y,
      size: 11,
      font: fontBold,
      color: colors.blue,
      maxWidth: width - marginX * 2,
    });
    y -= 18;
  }

  function drawHighlightBlock(text: string, accentColor: ReturnType<typeof rgb> = colors.blue) {
    const lines = wrapText(text, 84);
    const blockHeight = Math.max(36, 16 + lines.length * 15);
    ensureSpace(blockHeight + 12);

    page.drawRectangle({
      x: marginX,
      y: y - blockHeight + 8,
      width: 4,
      height: blockHeight,
      color: accentColor,
    });
    page.drawRectangle({
      x: marginX + 4,
      y: y - blockHeight + 8,
      width: width - marginX * 2 - 4,
      height: blockHeight,
      color: colors.blueLight,
    });

    let localY = y - 4;
    for (const line of lines) {
      page.drawText(line, {
        x: marginX + 16,
        y: localY,
        size: 10.5,
        font: fontRegular,
        color: colors.text,
        maxWidth: width - marginX * 2 - 28,
      });
      localY -= 15;
    }
    y -= blockHeight + 12;
  }

  function drawBullets(items: string[], indent = 0) {
    const safeItems = items.length ? items : ["Non renseigné"];
    for (const item of safeItems) {
      const lines = wrapText(item, 82 - Math.floor(indent / 5));
      ensureSpace(lines.length * 15 + 4);
      page.drawText("-", {
        x: marginX + indent,
        y,
        size: 10.5,
        font: fontBold,
        color: colors.blue,
      });
      let first = true;
      for (const line of lines) {
        page.drawText(line, {
          x: marginX + indent + 12,
          y,
          size: 10.5,
          font: fontRegular,
          color: colors.text,
          maxWidth: width - marginX * 2 - indent - 12,
        });
        y -= 15;
        if (first) first = false;
      }
      y -= 2;
    }
  }

  function drawTimeline(items: { when: string; action: string }[]) {
    const safeItems = items.length ? items : [{ when: "À définir", action: "Plan de diffusion non renseigné" }];
    for (const item of safeItems) {
      const actionLines = wrapText(item.action, 74);
      const blockHeight = Math.max(30, 14 + actionLines.length * 14);
      ensureSpace(blockHeight + 8);

      page.drawRectangle({
        x: marginX,
        y: y - blockHeight + 6,
        width: 64,
        height: blockHeight,
        color: colors.navy,
      });
      page.drawText(sanitizePdfText(item.when), {
        x: marginX + 8,
        y: y - blockHeight / 2 + 3,
        size: 9,
        font: fontBold,
        color: colors.white,
        maxWidth: 50,
      });

      page.drawRectangle({
        x: marginX + 64,
        y: y - blockHeight + 6,
        width: width - marginX * 2 - 64,
        height: blockHeight,
        color: colors.blueLight,
        borderColor: colors.border,
        borderWidth: 0.5,
      });

      let localY = y - 8;
      for (const line of actionLines) {
        page.drawText(line, {
          x: marginX + 76,
          y: localY,
          size: 10,
          font: fontRegular,
          color: colors.text,
          maxWidth: width - marginX * 2 - 88,
        });
        localY -= 14;
      }
      y -= blockHeight + 8;
    }
  }

  function drawKpiGrid(kpis: { indicator: string; target: string; timing: string }[]) {
    const colWidth = (width - marginX * 2) / Math.min(kpis.length, 3);
    const rows = Math.ceil(kpis.length / 3);

    for (let row = 0; row < rows; row++) {
      const rowKpis = kpis.slice(row * 3, row * 3 + 3);
      const blockH = 56;
      ensureSpace(blockH + 8);

      rowKpis.forEach((kpi, col) => {
        const x = marginX + col * colWidth;
        page.drawRectangle({
          x,
          y: y - blockH + 6,
          width: colWidth - 6,
          height: blockH,
          color: colors.white,
          borderColor: colors.border,
          borderWidth: 0.5,
        });
        page.drawText(sanitizePdfText(kpi.indicator), {
          x: x + 10,
          y: y - 10,
          size: 8.5,
          font: fontRegular,
          color: colors.muted,
          maxWidth: colWidth - 20,
        });
        page.drawText(sanitizePdfText(kpi.target), {
          x: x + 10,
          y: y - 26,
          size: 13,
          font: fontBold,
          color: colors.navy,
          maxWidth: colWidth - 20,
        });
        page.drawText(`Echéance : ${sanitizePdfText(kpi.timing)}`, {
          x: x + 10,
          y: y - 42,
          size: 8,
          font: fontRegular,
          color: colors.muted,
          maxWidth: colWidth - 20,
        });
      });
      y -= blockH + 8;
    }
  }

  function drawRiskItem(risk: { risk: string; level: string; mitigation: string }) {
    const levelColor =
      risk.level === "élevé" ? colors.riskHigh :
      risk.level === "moyen" ? colors.riskMedium :
      colors.riskLow;
    const levelLabel = risk.level === "élevé" ? "ELEVE" : risk.level === "moyen" ? "MOYEN" : "FAIBLE";

    const riskLines = wrapText(risk.risk, 78);
    const mitigLines = wrapText(`Mitigation : ${risk.mitigation}`, 78);
    const blockH = Math.max(48, 16 + (riskLines.length + mitigLines.length) * 14);
    ensureSpace(blockH + 8);

    page.drawRectangle({
      x: marginX,
      y: y - blockH + 6,
      width: width - marginX * 2,
      height: blockH,
      color: colors.white,
      borderColor: colors.border,
      borderWidth: 0.5,
    });

    page.drawText(levelLabel, {
      x: marginX + 10,
      y: y - 10,
      size: 8,
      font: fontBold,
      color: levelColor,
    });

    let localY = y - 24;
    for (const line of riskLines) {
      page.drawText(line, {
        x: marginX + 10,
        y: localY,
        size: 10,
        font: fontBold,
        color: colors.text,
        maxWidth: width - marginX * 2 - 20,
      });
      localY -= 14;
    }
    for (const line of mitigLines) {
      page.drawText(line, {
        x: marginX + 10,
        y: localY,
        size: 9.5,
        font: fontRegular,
        color: colors.muted,
        maxWidth: width - marginX * 2 - 20,
      });
      localY -= 14;
    }
    y -= blockH + 8;
  }

  function drawEventFormatCard(
    fmt: EventFormatRecommendation,
    accentColor: ReturnType<typeof rgb> = colors.blue
  ) {
    const catLabel = CATEGORY_LABELS_PDF[fmt.category] ?? fmt.category;
    const whyLines = wrapText(fmt.whyRecommended || "Non renseigne", 80);
    const impactLines = wrapText(`Impact : ${fmt.expectedImpact || "Non renseigne"}`, 80);
    const headerH = 40;
    const bodyH = (whyLines.length + impactLines.length) * 13;
    const blockHeight = Math.max(68, headerH + bodyH + 8);
    ensureSpace(blockHeight + 10);

    // Card background
    page.drawRectangle({
      x: marginX, y: y - blockHeight + 6,
      width: width - marginX * 2, height: blockHeight,
      color: colors.white, borderColor: colors.border, borderWidth: 0.5,
    });
    // Left accent bar
    page.drawRectangle({
      x: marginX, y: y - blockHeight + 6,
      width: 4, height: blockHeight, color: accentColor,
    });
    // Format name
    page.drawText(sanitizePdfText(fmt.format), {
      x: marginX + 14, y: y - 12,
      size: 11, font: fontBold, color: colors.navy,
      maxWidth: width - marginX * 2 - 30,
    });
    // Meta row: category · level · score
    page.drawText(sanitizePdfText(`${catLabel}  |  ${fmt.implementationLevel}  |  Pertinence ${fmt.relevanceScore}/5`), {
      x: marginX + 14, y: y - 27,
      size: 8.5, font: fontRegular, color: colors.muted,
      maxWidth: width - marginX * 2 - 30,
    });
    // Thin divider
    page.drawLine({
      start: { x: marginX + 14, y: y - 34 },
      end: { x: width - marginX - 14, y: y - 34 },
      thickness: 0.3, color: colors.border,
    });

    let localY = y - 46;
    for (const line of whyLines) {
      page.drawText(line, {
        x: marginX + 14, y: localY, size: 9.5,
        font: fontRegular, color: colors.text,
        maxWidth: width - marginX * 2 - 28,
      });
      localY -= 13;
    }
    for (const line of impactLines) {
      page.drawText(line, {
        x: marginX + 14, y: localY, size: 9.5,
        font: fontRegular, color: colors.muted,
        maxWidth: width - marginX * 2 - 28,
      });
      localY -= 13;
    }
    y -= blockHeight + 8;
  }

  function drawContentBlock(title: string, content: string) {
    const lines = wrapText(content || "Non renseigné", 84);
    const blockHeight = Math.max(54, 30 + lines.length * 14);
    ensureSpace(blockHeight + 16);

    page.drawRectangle({
      x: marginX,
      y: y - blockHeight + 8,
      width: width - marginX * 2,
      height: blockHeight,
      color: colors.white,
      borderColor: colors.border,
      borderWidth: 0.5,
    });
    page.drawRectangle({
      x: marginX,
      y: y - 20,
      width: width - marginX * 2,
      height: 20,
      color: colors.navy,
    });
    page.drawText(sanitizePdfText(title).toUpperCase(), {
      x: marginX + 12,
      y: y - 14,
      size: 9,
      font: fontBold,
      color: colors.white,
    });

    let localY = y - 34;
    for (const line of lines) {
      page.drawText(line, {
        x: marginX + 12,
        y: localY,
        size: 10,
        font: fontRegular,
        color: colors.text,
        maxWidth: width - marginX * 2 - 24,
      });
      localY -= 14;
    }
    y -= blockHeight + 16;
  }

  /* ---- COVER PAGE ---- */

  // Navy header band
  page.drawRectangle({ x: 0, y: height - 200, width, height: 200, color: colors.navy });
  // Blue accent line
  page.drawRectangle({ x: 0, y: height - 202, width, height: 3, color: colors.indigo });

  page.drawText("CAMPAIGN STUDIO", {
    x: marginX,
    y: height - 80,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Dossier de communication interne", {
    x: marginX,
    y: height - 100,
    size: 10,
    font: fontRegular,
    color: rgb(0.7, 0.75, 0.85),
  });
  page.drawText(sanitizePdfText(valueOrFallback(project.title)), {
    x: marginX,
    y: height - 138,
    size: 20,
    font: fontBold,
    color: colors.white,
    maxWidth: width - marginX * 2,
  });

  // Metadata block — position from top, not relative to y cursor
  const metaBlockY = height - 230;
  page.drawRectangle({ x: marginX, y: metaBlockY - 56, width: width - marginX * 2, height: 60, color: colors.blueLight, borderColor: colors.border, borderWidth: 0.5 });
  page.drawText(`Statut : ${valueOrFallback(project.status)}`, { x: marginX + 16, y: metaBlockY - 20, size: 10, font: fontRegular, color: colors.muted });
  page.drawText(`Date d'export : ${projectDate()}`, { x: marginX + 16, y: metaBlockY - 36, size: 10, font: fontRegular, color: colors.muted });

  // Set y cursor to below the metadata block
  y = metaBlockY - 72;

  // Executive summary on cover
  if (project.output.executiveSummary) {
    drawSpacer(12);
    drawSubtitle("Synthèse exécutive");
    drawHighlightBlock(project.output.executiveSummary, colors.indigo);
  }

  // Brief summary on cover
  drawSpacer(10);
  const briefFields: [string, string][] = [
    ["Contexte", project.brief?.companyContext ?? ""],
    ["Enjeu", project.brief?.challenge ?? ""],
    ["Objectif", project.brief?.objective ?? ""],
    ["Cible", project.brief?.audience ?? ""],
  ];
  for (const [label, val] of briefFields) {
    drawParagraph(`${label} : ${valueOrFallback(val)}`, { size: 9.5, color: colors.muted });
  }

  drawFooter();

  /* ---- INTERIOR PAGES ---- */
  addPage();

  // 1. Diagnostic & Problématique
  drawSectionTitle("01", "Diagnostic de communication");
  if (project.output.communicationDiagnostic) {
    drawHighlightBlock(project.output.communicationDiagnostic, colors.blue);
  }
  drawSpacer(6);

  if (project.output.centralProblem) {
    drawSubtitle("Problématique centrale");
    drawParagraph(`"${project.output.centralProblem}"`, { size: 11, bold: true, color: colors.navy });
    drawSpacer(8);
  }

  // 2. Angle stratégique
  drawSectionTitle("02", "Parti pris stratégique");
  drawHighlightBlock(project.output.strategicAngle, colors.indigo);
  drawSpacer(6);

  // 3. Architecture du dispositif
  if (project.output.deviceArchitecture) {
    drawSectionTitle("03", "Architecture du dispositif");
    drawParagraph(project.output.deviceArchitecture, { size: 10.5 });
    drawSpacer(6);
  }

  // 4. Messages par audience
  if ((project.output.audienceMessages ?? []).length > 0) {
    drawSectionTitle("04", "Segmentation & messages par audience");
    for (const am of project.output.audienceMessages) {
      drawSubtitle(am.audience);
      drawParagraph(`"${am.message}"`, { size: 10, color: colors.text, x: marginX + 12 });
      drawParagraph(`Canal : ${am.channel}`, { size: 9, color: colors.muted, x: marginX + 12 });
      drawSpacer(4);
    }
  }

  // 5. Messages clés
  drawSectionTitle("05", "Messages clés");
  drawBullets(project.output.keyMessages ?? []);
  drawSpacer(6);

  // 6. Plan de déploiement
  drawSectionTitle("06", "Feuille de route — Plan de déploiement");
  drawTimeline(project.output.timeline ?? []);
  drawSpacer(6);

  // 7. Mix de canaux
  const channels = project.output.channelMix ?? project.output.recommendedFormats ?? [];
  if (channels.length > 0) {
    drawSectionTitle("07", "Mix de canaux recommandé");
    drawBullets(channels);
    drawSpacer(6);
  }

  // 8. Relais internes
  if ((project.output.relays ?? []).length > 0) {
    drawSectionTitle("08", "Relais internes & gouvernance");
    if (project.output.governance) {
      drawParagraph(project.output.governance, { size: 10, color: colors.muted });
      drawSpacer(6);
    }
    for (const relay of project.output.relays ?? []) {
      drawSubtitle(relay.role);
      drawParagraph(relay.mission, { size: 10, x: marginX + 12 });
      drawSpacer(2);
    }
  }

  // 9. KPIs
  if ((project.output.kpis ?? []).length > 0) {
    drawSectionTitle("09", "KPIs de pilotage");
    drawKpiGrid(project.output.kpis ?? []);
    drawSpacer(6);
  }

  // 10. Risks
  if ((project.output.risks ?? []).length > 0) {
    drawSectionTitle("10", "Risques & points de vigilance");
    for (const risk of project.output.risks ?? []) {
      drawRiskItem(risk);
    }
    drawSpacer(4);
  }

  // 11. Quick Wins
  if ((project.output.quickWins ?? []).length > 0) {
    drawSectionTitle("11", "Quick Wins — Actions immédiates");
    drawBullets(project.output.quickWins ?? []);
    drawSpacer(6);
  }

  // 12. Contents
  drawSectionTitle("12", "Contenus prêts à diffuser");
  drawContentBlock("Email direction", project.output.generatedContent?.executiveEmail ?? "");
  drawContentBlock("Post intranet", project.output.generatedContent?.intranetPost ?? "");
  drawContentBlock("Kit manager", project.output.generatedContent?.managerKit ?? "");
  drawContentBlock("FAQ collaborateurs", project.output.generatedContent?.faq ?? "");

  // 13. Scenarios
  if ((project.output.scenarios ?? []).length > 0) {
    drawSectionTitle("13", "Scénarios alternatifs");
    for (const scenario of project.output.scenarios ?? []) {
      drawSubtitle(`Scénario ${scenario.name}`);
      drawParagraph(scenario.description, { size: 10, color: colors.muted });
      drawBullets(scenario.actions, 12);
      drawSpacer(6);
    }
  }

  // 14. Vue Direction
  if (project.output.dircomView) {
    const dv = project.output.dircomView;
    drawSectionTitle("14", "Vue Direction — Synthèse décisionnelle");
    if (dv.summary) {
      drawHighlightBlock(dv.summary, colors.navy);
      drawSpacer(6);
    }
    if ((dv.decisionsToMake ?? []).length > 0) {
      drawSubtitle("Décisions à prendre");
      drawBullets(dv.decisionsToMake);
      drawSpacer(6);
    }
    if ((dv.keyRisks ?? []).length > 0) {
      drawSubtitle("Risques stratégiques");
      drawBullets(dv.keyRisks);
      drawSpacer(6);
    }
    if ((dv.keyArbitrations ?? []).length > 0) {
      drawSubtitle("Arbitrages assumés");
      drawBullets(dv.keyArbitrations);
      drawSpacer(6);
    }
  }

  // 15. Copilote Événementiel
  if (project.output.eventCopilot) {
    const ec = project.output.eventCopilot;
    drawSectionTitle("15", "Copilote événementiel");

    if (ec.strategicIntent) {
      drawHighlightBlock(ec.strategicIntent, colors.indigo);
      drawSpacer(6);
    }

    if ((ec.primaryEventFormats ?? []).length > 0) {
      drawSubtitle("Formats prioritaires");
      for (const fmt of ec.primaryEventFormats) {
        drawEventFormatCard(fmt, colors.navy);
        drawSpacer(2);
      }
      drawSpacer(4);
    }

    if ((ec.secondaryEventFormats ?? []).length > 0) {
      drawSubtitle("Formats complémentaires");
      for (const fmt of ec.secondaryEventFormats) {
        drawEventFormatCard(fmt, colors.blue);
        drawSpacer(2);
      }
      drawSpacer(4);
    }

    if ((ec.permanentCommunicationDevices ?? []).length > 0) {
      drawSubtitle("Dispositifs permanents");
      for (const fmt of ec.permanentCommunicationDevices) {
        drawEventFormatCard(fmt, colors.muted);
        drawSpacer(2);
      }
      drawSpacer(4);
    }

    if (ec.recommendedMix) {
      drawSubtitle("Mix recommandé");
      drawParagraph(ec.recommendedMix);
      drawSpacer(4);
    }

    if (ec.whyTheseFormats) {
      drawSubtitle("Pourquoi ce mix");
      drawParagraph(ec.whyTheseFormats);
      drawSpacer(4);
    }

    if (ec.beforePhase || ec.duringPhase || ec.afterPhase) {
      drawSubtitle("Déploiement en 3 phases");
      if (ec.beforePhase) drawParagraph(`Avant : ${ec.beforePhase}`, { size: 10 });
      if (ec.duringPhase) drawParagraph(`Pendant : ${ec.duringPhase}`, { size: 10 });
      if (ec.afterPhase)  drawParagraph(`Apres : ${ec.afterPhase}`, { size: 10 });
      drawSpacer(4);
    }

    if (ec.managerActivation) {
      drawSubtitle("Activation des managers");
      drawParagraph(ec.managerActivation);
      drawSpacer(4);
    }

    if (ec.participantExperience) {
      drawSubtitle("Expérience participant");
      drawParagraph(ec.participantExperience);
      drawSpacer(4);
    }

    if (ec.eventStorytelling) {
      drawSubtitle("Fil narratif de l'événement");
      drawParagraph(ec.eventStorytelling);
      drawSpacer(4);
    }

    if ((ec.watchouts ?? []).length > 0) {
      drawSubtitle("Points de vigilance");
      drawBullets(ec.watchouts);
      drawSpacer(4);
    }

    if ((ec.formatsToAvoid ?? []).length > 0) {
      drawSubtitle("Formats déconseillés pour ce brief");
      drawBullets(ec.formatsToAvoid);
    }
  }

  drawFooter();
  return await pdfDoc.save();
}

/* =========================
   DOCX PREMIUM
========================= */

function sp(text = "", opts?: {
  bold?: boolean;
  size?: number;
  color?: string;
  spacingAfter?: number;
  spacingBefore?: number;
  heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  pageBreakBefore?: boolean;
  shadingFill?: string;
  indent?: number;
  border?: "left";
}) {
  return new Paragraph({
    heading: opts?.heading,
    alignment: opts?.alignment,
    pageBreakBefore: opts?.pageBreakBefore,
    shading: opts?.shadingFill ? { fill: opts.shadingFill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    spacing: { before: opts?.spacingBefore ?? 0, after: opts?.spacingAfter ?? 160 },
    indent: opts?.indent ? { left: opts.indent } : undefined,
    border: opts?.border === "left" ? {
      left: { style: BorderStyle.SINGLE, size: 12, color: "1E40AF" },
    } : undefined,
    children: [
      new TextRun({
        text: text || " ",
        bold: opts?.bold ?? false,
        size: opts?.size ?? 22,
        color: opts?.color,
      }),
    ],
  });
}

function sectionHeading(num: string, title: string) {
  return new Paragraph({
    spacing: { before: 320, after: 200 },
    shading: { fill: "0F1629", type: ShadingType.CLEAR, color: "auto" },
    children: [
      new TextRun({ text: `${num}  ${title.toUpperCase()}`, bold: true, size: 22, color: "FFFFFF" }),
    ],
  });
}

function subHeading(text: string) {
  return sp(text, { bold: true, size: 23, color: "1E40AF", spacingAfter: 120, spacingBefore: 160 });
}

function bodyLines(text = ""): Paragraph[] {
  return (text || "Non renseigné").split("\n").map(
    (line) => new Paragraph({
      spacing: { after: 100 },
      indent: { left: 0 },
      children: [new TextRun({ text: line || " ", size: 22, color: "1A2030" })],
    })
  );
}

function bulletItem(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22, color: "1A2030" })],
  });
}

function riskLevelColor(level: RiskItem["level"]) {
  return level === "élevé" ? "DC2626" : level === "moyen" ? "D97706" : "059669";
}

function eventFormatDocx(fmt: EventFormatRecommendation): Paragraph[] {
  const cat = CATEGORY_LABELS_DOCX[fmt.category] ?? fmt.category;
  return [
    new Paragraph({
      spacing: { before: 140, after: 60 },
      shading: { fill: "F8F7F4", type: ShadingType.CLEAR, color: "auto" },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: "1E3A5F" } },
      indent: { left: 120, right: 40 },
      children: [
        new TextRun({ text: fmt.format, bold: true, size: 24, color: "0B1422" }),
        new TextRun({ text: `  ·  ${cat}  ·  ${fmt.implementationLevel}  ·  ${fmt.relevanceScore}/5`, size: 18, color: "9CA3AF" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 340 },
      children: [new TextRun({ text: fmt.whyRecommended || " ", size: 21, color: "1A2030" })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      indent: { left: 340 },
      children: [
        new TextRun({ text: "Impact attendu : ", bold: true, size: 20, color: "1E40AF" }),
        new TextRun({ text: fmt.expectedImpact || " ", size: 20, color: "576070" }),
      ],
    }),
  ];
}

function buildPremiumDocx(project: StudioProject) {
  const title = valueOrFallback(project.title);
  const out = project.output;

  const children: Paragraph[] = [

    /* ---- COVER ---- */
    sp("CAMPAIGN STUDIO", { bold: true, size: 36, color: "0F1629", spacingAfter: 160 }),
    sp("Dossier de communication interne", { size: 24, color: "4B5563", spacingAfter: 400 }),
    sp(title, { bold: true, size: 34, color: "0F1629", spacingAfter: 200 }),
    sp(`Statut : ${valueOrFallback(project.status)}`, { size: 20, color: "64748B", spacingAfter: 80 }),
    sp(`Date d'export : ${projectDate()}`, { size: 20, color: "64748B", spacingAfter: 300 }),

    // Executive summary box on cover
    ...(out.executiveSummary ? [
      new Paragraph({
        spacing: { before: 0, after: 160 },
        shading: { fill: "EFF6FF", type: ShadingType.CLEAR, color: "auto" },
        border: {
          top: { style: BorderStyle.SINGLE, size: 2, color: "DBEAFE" },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "DBEAFE" },
          left: { style: BorderStyle.SINGLE, size: 20, color: "1E40AF" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "DBEAFE" },
        },
        indent: { left: 160, right: 80 },
        children: [
          new TextRun({ text: "Synthèse exécutive — ", bold: true, size: 22, color: "1E40AF" }),
          new TextRun({ text: out.executiveSummary, size: 22, color: "111827" }),
        ],
      }),
    ] : []),

    new Paragraph({ children: [new PageBreak()] }),

    /* ---- 01. DIAGNOSTIC ---- */
    sectionHeading("01", "Diagnostic de communication"),
    ...(out.communicationDiagnostic ? [
      new Paragraph({
        spacing: { after: 160 },
        shading: { fill: "EFF6FF", type: ShadingType.CLEAR, color: "auto" },
        border: { left: { style: BorderStyle.SINGLE, size: 16, color: "3B82F6" } },
        indent: { left: 160 },
        children: [new TextRun({ text: out.communicationDiagnostic, size: 22, color: "1A2030" })],
      }),
    ] : []),

    ...(out.centralProblem ? [
      subHeading("Problématique centrale"),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: `"${out.centralProblem}"`, bold: true, size: 24, color: "0F1629", italics: true }),
        ],
      }),
    ] : []),

    /* ---- 02. ANGLE STRATÉGIQUE ---- */
    sectionHeading("02", "Parti pris stratégique"),
    new Paragraph({
      spacing: { after: 200 },
      shading: { fill: "EFF6FF", type: ShadingType.CLEAR, color: "auto" },
      border: { left: { style: BorderStyle.SINGLE, size: 16, color: "4F46E5" } },
      indent: { left: 160 },
      children: [new TextRun({ text: out.strategicAngle, size: 22, color: "1A2030" })],
    }),

    /* ---- 03. ARCHITECTURE ---- */
    ...(out.deviceArchitecture ? [
      sectionHeading("03", "Architecture du dispositif"),
      ...bodyLines(out.deviceArchitecture),
    ] : []),

    /* ---- 04. MESSAGES PAR AUDIENCE ---- */
    ...((out.audienceMessages ?? []).length > 0 ? [
      sectionHeading("04", "Segmentation & messages par audience"),
      ...(out.audienceMessages ?? []).flatMap((am) => [
        subHeading(am.audience),
        new Paragraph({
          spacing: { after: 100 },
          indent: { left: 220 },
          children: [new TextRun({ text: `"${am.message}"`, size: 22, color: "1A2030", italics: true })],
        }),
        sp(`Canal : ${am.channel}`, { size: 20, color: "64748B", spacingAfter: 160, indent: 220 }),
      ]),
    ] : []),

    /* ---- 05. MESSAGES CLÉS ---- */
    sectionHeading("05", "Messages clés"),
    ...(out.keyMessages ?? []).map((msg) => bulletItem(msg)),
    sp(" ", { spacingAfter: 80 }),

    /* ---- 06. PLAN DE DÉPLOIEMENT ---- */
    sectionHeading("06", "Feuille de route — Plan de déploiement"),
    ...(out.timeline ?? []).flatMap((item) => [
      new Paragraph({
        spacing: { after: 40, before: 80 },
        children: [
          new TextRun({ text: item.when, bold: true, size: 22, color: "0F1629" }),
          new TextRun({ text: "  —  ", size: 22, color: "94A3B8" }),
          new TextRun({ text: item.action, size: 22, color: "1A2030" }),
        ],
      }),
    ]),
    sp(" ", { spacingAfter: 80 }),

    /* ---- 07. MIX DE CANAUX ---- */
    ...((out.channelMix ?? out.recommendedFormats ?? []).length > 0 ? [
      sectionHeading("07", "Mix de canaux recommandé"),
      ...(out.channelMix ?? out.recommendedFormats ?? []).map((ch) => bulletItem(ch)),
      sp(" ", { spacingAfter: 80 }),
    ] : []),

    /* ---- 08. RELAIS & GOUVERNANCE ---- */
    ...((out.relays ?? []).length > 0 ? [
      sectionHeading("08", "Relais internes & gouvernance"),
      ...(out.governance ? bodyLines(out.governance) : []),
      ...(out.relays ?? []).flatMap((relay) => [
        sp(relay.role, { bold: true, size: 22, color: "1E40AF", spacingAfter: 60, spacingBefore: 120 }),
        sp(relay.mission, { size: 22, color: "1A2030", spacingAfter: 140, indent: 220 }),
      ]),
    ] : []),

    /* ---- 09. KPIs ---- */
    ...((out.kpis ?? []).length > 0 ? [
      sectionHeading("09", "KPIs de pilotage"),
      ...(out.kpis ?? []).map((kpi) => new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: kpi.target, bold: true, size: 26, color: "0F1629" }),
          new TextRun({ text: `  ${kpi.indicator} — Echéance : ${kpi.timing}`, size: 20, color: "64748B" }),
        ],
      })),
      sp(" ", { spacingAfter: 80 }),
    ] : []),

    /* ---- 10. RISQUES ---- */
    ...((out.risks ?? []).length > 0 ? [
      sectionHeading("10", "Risques & points de vigilance"),
      ...(out.risks ?? []).flatMap((risk) => [
        new Paragraph({
          spacing: { after: 60, before: 120 },
          children: [
            new TextRun({ text: risk.level.toUpperCase(), bold: true, size: 18, color: riskLevelColor(risk.level) }),
            new TextRun({ text: `  ${risk.risk}`, bold: true, size: 22, color: "1A2030" }),
          ],
        }),
        sp(`Mitigation : ${risk.mitigation}`, { size: 21, color: "64748B", spacingAfter: 120, indent: 220 }),
      ]),
    ] : []),

    /* ---- 11. QUICK WINS ---- */
    ...((out.quickWins ?? []).length > 0 ? [
      sectionHeading("11", "Quick Wins — Actions immédiates"),
      ...(out.quickWins ?? []).map((win) => bulletItem(win)),
      sp(" ", { spacingAfter: 80 }),
    ] : []),

    /* ---- 12. CONTENUS ---- */
    sectionHeading("12", "Contenus prêts à diffuser"),

    subHeading("Email direction"),
    ...bodyLines(out.generatedContent?.executiveEmail ?? ""),
    sp(" ", { spacingAfter: 120 }),

    subHeading("Post intranet"),
    ...bodyLines(out.generatedContent?.intranetPost ?? ""),
    sp(" ", { spacingAfter: 120 }),

    subHeading("Kit manager"),
    ...bodyLines(out.generatedContent?.managerKit ?? ""),
    sp(" ", { spacingAfter: 120 }),

    subHeading("FAQ collaborateurs"),
    ...bodyLines(out.generatedContent?.faq ?? ""),

    /* ---- 13. SCÉNARIOS ---- */
    ...((out.scenarios ?? []).length > 0 ? [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("13", "Scénarios alternatifs"),
      ...(out.scenarios ?? []).flatMap((scenario) => [
        subHeading(`Scénario ${scenario.name}`),
        sp(scenario.description, { size: 22, color: "64748B", spacingAfter: 120 }),
        ...(scenario.actions ?? []).map((action) => bulletItem(action)),
        sp(" ", { spacingAfter: 100 }),
      ]),
    ] : []),

    /* ---- 14. VUE DIRECTION ---- */
    ...(out.dircomView ? [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("14", "Vue Direction — Synthèse décisionnelle"),
      // Summary — dark highlight block
      ...(out.dircomView.summary ? [
        new Paragraph({
          spacing: { before: 0, after: 200 },
          shading: { fill: "0B1422", type: ShadingType.CLEAR, color: "auto" },
          border: { left: { style: BorderStyle.SINGLE, size: 20, color: "2A5298" } },
          indent: { left: 160, right: 80 },
          children: [
            new TextRun({ text: "Synthèse CODIR — ", bold: true, size: 22, color: "FFFFFF" }),
            new TextRun({ text: out.dircomView.summary, size: 22, color: "E2DFD8" }),
          ],
        }),
      ] : []),
      // Three columns as sequential blocks
      ...((out.dircomView.decisionsToMake ?? []).length > 0 ? [
        subHeading("Décisions à prendre"),
        ...(out.dircomView.decisionsToMake ?? []).map((d) => bulletItem(d)),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      ...((out.dircomView.keyRisks ?? []).length > 0 ? [
        subHeading("Risques stratégiques"),
        ...(out.dircomView.keyRisks ?? []).map((r) => bulletItem(r)),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      ...((out.dircomView.keyArbitrations ?? []).length > 0 ? [
        subHeading("Arbitrages assumés"),
        ...(out.dircomView.keyArbitrations ?? []).map((a) => bulletItem(a)),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
    ] : []),

    /* ---- 15. COPILOTE ÉVÉNEMENTIEL ---- */
    ...(out.eventCopilot ? [
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeading("15", "Copilote événementiel"),
      // Strategic intent
      ...(out.eventCopilot.strategicIntent ? [
        new Paragraph({
          spacing: { before: 0, after: 200 },
          shading: { fill: "EEF3FB", type: ShadingType.CLEAR, color: "auto" },
          border: { left: { style: BorderStyle.SINGLE, size: 20, color: "3730A3" } },
          indent: { left: 160, right: 80 },
          children: [
            new TextRun({ text: "Intention stratégique — ", bold: true, size: 22, color: "3730A3" }),
            new TextRun({ text: out.eventCopilot.strategicIntent, size: 22, color: "0B1422" }),
          ],
        }),
      ] : []),
      // Primary formats
      ...((out.eventCopilot.primaryEventFormats ?? []).length > 0 ? [
        subHeading("Formats prioritaires"),
        ...(out.eventCopilot.primaryEventFormats ?? []).flatMap((f) => eventFormatDocx(f)),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // Secondary formats
      ...((out.eventCopilot.secondaryEventFormats ?? []).length > 0 ? [
        subHeading("Formats complémentaires"),
        ...(out.eventCopilot.secondaryEventFormats ?? []).flatMap((f) => eventFormatDocx(f)),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // Permanent devices
      ...((out.eventCopilot.permanentCommunicationDevices ?? []).length > 0 ? [
        subHeading("Dispositifs permanents"),
        ...(out.eventCopilot.permanentCommunicationDevices ?? []).flatMap((f) => eventFormatDocx(f)),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // Mix & justification
      ...(out.eventCopilot.recommendedMix ? [
        subHeading("Mix recommandé"),
        ...bodyLines(out.eventCopilot.recommendedMix),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      ...(out.eventCopilot.whyTheseFormats ? [
        subHeading("Pourquoi ce mix pour ce brief"),
        ...bodyLines(out.eventCopilot.whyTheseFormats),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // 3 phases
      ...(out.eventCopilot.beforePhase || out.eventCopilot.duringPhase || out.eventCopilot.afterPhase ? [
        subHeading("Déploiement en 3 phases"),
        ...(out.eventCopilot.beforePhase ? [
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "Avant  — ", bold: true, size: 22, color: "0B1422" }),
              new TextRun({ text: out.eventCopilot.beforePhase, size: 22, color: "1A2030" }),
            ],
          }),
        ] : []),
        ...(out.eventCopilot.duringPhase ? [
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "Pendant — ", bold: true, size: 22, color: "0B1422" }),
              new TextRun({ text: out.eventCopilot.duringPhase, size: 22, color: "1A2030" }),
            ],
          }),
        ] : []),
        ...(out.eventCopilot.afterPhase ? [
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({ text: "Après   — ", bold: true, size: 22, color: "0B1422" }),
              new TextRun({ text: out.eventCopilot.afterPhase, size: 22, color: "1A2030" }),
            ],
          }),
        ] : []),
      ] : []),
      // Manager activation
      ...(out.eventCopilot.managerActivation ? [
        subHeading("Activation des managers"),
        ...bodyLines(out.eventCopilot.managerActivation),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // Participant experience
      ...(out.eventCopilot.participantExperience ? [
        subHeading("Expérience participant"),
        ...bodyLines(out.eventCopilot.participantExperience),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // Storytelling
      ...(out.eventCopilot.eventStorytelling ? [
        subHeading("Fil narratif"),
        ...bodyLines(out.eventCopilot.eventStorytelling),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // Watchouts
      ...((out.eventCopilot.watchouts ?? []).length > 0 ? [
        subHeading("Points de vigilance"),
        ...(out.eventCopilot.watchouts ?? []).map((w) => bulletItem(w)),
        sp(" ", { spacingAfter: 80 }),
      ] : []),
      // Formats to avoid
      ...((out.eventCopilot.formatsToAvoid ?? []).length > 0 ? [
        subHeading("Formats déconseillés pour ce brief"),
        ...(out.eventCopilot.formatsToAvoid ?? []).map((f) => bulletItem(f)),
      ] : []),
    ] : []),
  ];

  return new Document({
    creator: "Stratly · Campaign",
    title,
    description: "Dossier de communication interne",
    sections: [{ properties: {}, children }],
  });
}

/* =========================
   ROUTE
========================= */

export async function POST(request: Request) {
  try {
    let body: ExportRequest;
    try {
      body = (await request.json()) as ExportRequest;
    } catch {
      return NextResponse.json({ error: "Body JSON invalide ou trop volumineux" }, { status: 400 });
    }

    if (!body?.project || !body?.format) {
      return NextResponse.json({ error: "Payload invalide : project et format requis" }, { status: 400 });
    }

    const filename = safeFilename(body.project.title || "campaign-studio");

    if (body.format === "pdf") {
      console.log(`[Export] Generating PDF for "${body.project.title}"`);
      const pdfBytes = await buildPremiumPdf(body.project);
      console.log(`[Export] PDF generated, ${pdfBytes.length} bytes`);
      return new Response(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (body.format === "docx") {
      console.log(`[Export] Generating DOCX for "${body.project.title}"`);
      const doc = buildPremiumDocx(body.project);
      const buffer = await Packer.toBuffer(doc);
      console.log(`[Export] DOCX generated, ${buffer.length} bytes`);
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}.docx"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ error: "Format non supporté. Valeurs acceptées : pdf, docx" }, { status: 400 });
  } catch (error) {
    console.error("[Export] Route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue pendant l'export" },
      { status: 500 }
    );
  }
}
