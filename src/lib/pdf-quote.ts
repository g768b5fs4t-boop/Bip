import PDFDocument from "pdfkit";
import type { Client, Company, Quote, QuoteTotals } from "./types";
import { lineTotalHt } from "./quote-engine";
import { formatEuro } from "./money";

function bufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function buildQuotePdf(params: {
  company: Company;
  client: Client;
  quote: Quote;
  totals: QuoteTotals;
}): Promise<Buffer> {
  const { company, client, quote, totals } = params;
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const done = bufferFromDoc(doc);

  doc
    .fillColor("#0F3D3E")
    .fontSize(20)
    .text(company.name, { continued: false });
  doc
    .fontSize(9)
    .fillColor("#334155")
    .text(`${company.address}`)
    .text(`${company.postalCode} ${company.city}`)
    .text(`Tél. ${company.phone} · ${company.email}`)
    .text(`SIRET ${company.siret}`);

  doc.moveDown();
  doc
    .fillColor("#0F3D3E")
    .fontSize(16)
    .text(`Devis ${quote.number}`, { align: "right" });
  doc
    .fontSize(9)
    .fillColor("#64748B")
    .text(
      `Date : ${new Date(quote.createdAt).toLocaleDateString("fr-FR")} · Valide jusqu'au ${new Date(quote.validUntil).toLocaleDateString("fr-FR")}`,
      { align: "right" },
    );

  doc.moveDown();
  doc.fillColor("#0F172A").fontSize(11).text("Client");
  doc
    .fontSize(10)
    .fillColor("#334155")
    .text(client.name)
    .text([client.address, `${client.postalCode ?? ""} ${client.city ?? ""}`].filter(Boolean).join(" · "))
    .text([client.phone, client.email].filter(Boolean).join(" · "));

  doc.moveDown();
  const startY = doc.y;
  doc
    .fillColor("#F1F5F9")
    .rect(50, startY, 495, 22)
    .fill();
  doc
    .fillColor("#0F3D3E")
    .fontSize(8)
    .text("Désignation", 55, startY + 7, { width: 220 })
    .text("Qté", 280, startY + 7, { width: 40 })
    .text("P.U. HT", 330, startY + 7, { width: 70 })
    .text("TVA", 410, startY + 7, { width: 40 })
    .text("Total HT", 460, startY + 7, { width: 80 });

  let y = startY + 28;
  doc.fillColor("#0F172A").fontSize(9);
  for (const line of quote.lines) {
    const total = lineTotalHt(line);
    const label = `${line.reference ? `[${line.reference}] ` : ""}${line.designation}`;
    doc.text(label, 55, y, { width: 220 });
    doc.text(`${line.quantity} ${line.unit}`, 280, y, { width: 40 });
    doc.text(formatEuro(line.unitPriceHt), 330, y, { width: 70 });
    doc.text(`${line.vatRate} %`, 410, y, { width: 40 });
    doc.text(formatEuro(total), 460, y, { width: 80 });
    y += 20;
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  }

  doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor("#CBD5E1").stroke();
  y += 16;
  doc.fontSize(10).fillColor("#0F172A");
  doc.text(`Total HT : ${formatEuro(totals.totalHt)}`, 350, y, { width: 195, align: "right" });
  y += 16;
  doc.text(`TVA : ${formatEuro(totals.totalVat)}`, 350, y, { width: 195, align: "right" });
  y += 16;
  doc
    .fontSize(12)
    .fillColor("#0F3D3E")
    .text(`Total TTC : ${formatEuro(totals.totalTtc)}`, 350, y, {
      width: 195,
      align: "right",
    });

  y += 36;
  doc
    .fontSize(9)
    .fillColor("#334155")
    .text("Conditions de règlement", 50, y)
    .fillColor("#64748B")
    .text(company.paymentTerms, 50, y + 14, { width: 495 });

  y += 50;
  doc
    .fontSize(8)
    .fillColor("#94A3B8")
    .text(company.legalMentions, 50, y, { width: 495 });

  doc
    .fontSize(8)
    .fillColor("#94A3B8")
    .text("Document généré avec DevisRapide IA — validation humaine requise avant envoi.", 50, 780, {
      width: 495,
      align: "center",
    });

  doc.end();
  return done;
}
