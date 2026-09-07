const PDFDocument = require("pdfkit");

// Génère un PDF de facture et l'envoie directement dans la réponse HTTP
function renderInvoicePDF(res, invoice, content) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="facture-${invoice.numero}.pdf"`);
  doc.pipe(res);

  // En-tête
  doc.fontSize(20).text(content?.hero?.nom || "Il Ponte", { continued: false });
  doc.fontSize(10).fillColor("#555").text(content?.contact?.adresse || "");
  doc.text(content?.contact?.telephone || "");
  doc.text(content?.contact?.email || "");
  doc.moveDown(1.5);

  doc.fillColor("#000").fontSize(16).text(`Facture n° ${invoice.numero}`, { align: "right" });
  doc.fontSize(10).fillColor("#555").text(`Date : ${new Date(invoice.date).toLocaleDateString("fr-FR")}`, { align: "right" });
  doc.text(`Statut : ${invoice.statut}`, { align: "right" });
  doc.moveDown();

  // Client
  doc.fillColor("#000").fontSize(12).text("Facturé à :");
  doc.fontSize(11).text(invoice.client.nom || "");
  if (invoice.client.adresse) doc.text(invoice.client.adresse);
  if (invoice.client.email) doc.text(invoice.client.email);
  doc.moveDown(1.5);

  // Tableau des lignes
  const tableTop = doc.y;
  const col = { desc: 50, qte: 320, pu: 390, total: 470 };
  doc.fontSize(10).fillColor("#000");
  doc.text("Description", col.desc, tableTop);
  doc.text("Qté", col.qte, tableTop);
  doc.text("Prix U.", col.pu, tableTop);
  doc.text("Total", col.total, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#ccc").stroke();

  let y = tableTop + 22;
  let totalGeneral = 0;
  invoice.items.forEach((item) => {
    const ligneTotal = item.quantite * item.prixUnitaire;
    totalGeneral += ligneTotal;
    doc.fontSize(10).fillColor("#000");
    doc.text(item.description, col.desc, y, { width: 260 });
    doc.text(String(item.quantite), col.qte, y);
    doc.text(`${item.prixUnitaire.toFixed(2)} €`, col.pu, y);
    doc.text(`${ligneTotal.toFixed(2)} €`, col.total, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor("#ccc").stroke();
  doc.fontSize(12).text(`Total TTC : ${totalGeneral.toFixed(2)} €`, col.total - 60, y + 15);

  if (invoice.notes) {
    doc.moveDown(3);
    doc.fontSize(10).fillColor("#555").text(`Notes : ${invoice.notes}`);
  }

  doc.end();
}

module.exports = { renderInvoicePDF };
