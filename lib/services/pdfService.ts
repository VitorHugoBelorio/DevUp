import PDFDocument from "pdfkit";
import type { StoredDiagnostic } from "@/types/diagnostic";

type PdfSection = {
  title: string;
  items: string[];
};

function addSection(doc: PDFKit.PDFDocument, section: PdfSection): void {
  doc.moveDown(0.9);
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#111827").text(section.title);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10.5).fillColor("#374151");

  for (const item of section.items) {
    doc.text(`- ${item}`, { continued: false, lineGap: 2 });
  }
}

export async function renderDiagnosticPdf(diagnostic: StoredDiagnostic): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: "DevUp - Plano de estudos",
      Author: "DevUp"
    }
  });

  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.font("Helvetica-Bold").fontSize(24).fillColor("#0f172a").text("DevUp");
  doc.font("Helvetica").fontSize(12).fillColor("#475569").text("Plano personalizado de estudos");
  doc.moveDown(0.8);
  doc.fontSize(9).fillColor("#64748b").text(`Gerado em ${new Date(diagnostic.createdAt).toLocaleDateString("pt-BR")}`);

  addSection(doc, {
    title: "Diagnostico",
    items: [
      diagnostic.result.diagnosis.level_estimation,
      ...diagnostic.result.diagnosis.strengths.map((item) => `Forca: ${item}`),
      ...diagnostic.result.diagnosis.weaknesses.map((item) => `Ponto de melhoria: ${item}`)
    ]
  });

  addSection(doc, {
    title: "Direcao",
    items: [
      ...diagnostic.result.direction.focus_now.map((item) => `Foco agora: ${item}`),
      ...diagnostic.result.direction.next_steps.map((item) => `Proximo passo: ${item}`)
    ]
  });

  doc.moveDown(0.9);
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#111827").text("Plano de estudos");
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10.5).fillColor("#374151");

  for (const day of diagnostic.result.study_plan) {
    doc.font("Helvetica-Bold").text(`Dia ${day.day}: ${day.topics.join(", ")}`);
    doc.font("Helvetica").text(day.description, { lineGap: 2 });
    doc.moveDown(0.4);
  }

  addSection(doc, {
    title: "Recomendacoes",
    items: diagnostic.result.recommendations.map(
      (item) => `${item.title} (${item.type}): ${item.reason}`
    )
  });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}
