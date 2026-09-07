const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/store");
const { requireAuth, requireRole } = require("../middleware/auth");
const { renderInvoicePDF } = require("../utils/pdf");

// Rôles autorisés à gérer les factures : admin et gérant
const CAN_MANAGE = ["admin", "gerant"];

function nextInvoiceNumber(invoices) {
  const year = new Date().getFullYear();
  const countThisYear = invoices.filter((i) => i.numero.startsWith(`${year}-`)).length;
  return `${year}-${String(countThisYear + 1).padStart(4, "0")}`;
}

// GET /api/invoices - liste des factures
router.get("/", requireAuth, requireRole(...CAN_MANAGE, "employe"), (req, res) => {
  const invoices = readJSON("invoices.json", []);
  res.json(invoices.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// GET /api/invoices/:id - détail d'une facture
router.get("/:id", requireAuth, requireRole(...CAN_MANAGE, "employe"), (req, res) => {
  const invoices = readJSON("invoices.json", []);
  const invoice = invoices.find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: "Facture introuvable." });
  res.json(invoice);
});

// GET /api/invoices/:id/pdf - téléchargement PDF
router.get("/:id/pdf", requireAuth, requireRole(...CAN_MANAGE, "employe"), (req, res) => {
  const invoices = readJSON("invoices.json", []);
  const invoice = invoices.find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: "Facture introuvable." });
  const content = readJSON("content.json", {});
  renderInvoicePDF(res, invoice, content);
});

// POST /api/invoices - créer une facture
router.post("/", requireAuth, requireRole(...CAN_MANAGE), (req, res) => {
  const { client, items, statut, notes, date } = req.body || {};
  if (!client || !client.nom) return res.status(400).json({ error: "Le nom du client est requis." });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Au moins une ligne de facturation est requise." });
  }
  for (const item of items) {
    if (!item.description || item.quantite == null || item.prixUnitaire == null) {
      return res.status(400).json({ error: "Chaque ligne doit avoir une description, une quantité et un prix unitaire." });
    }
  }

  const invoices = readJSON("invoices.json", []);
  const invoice = {
    id: crypto.randomUUID(),
    numero: nextInvoiceNumber(invoices),
    client,
    items,
    statut: statut === "payée" ? "payée" : "en attente",
    notes: notes || "",
    date: date || new Date().toISOString(),
    createdBy: req.user.username,
    createdAt: new Date().toISOString(),
  };
  invoices.push(invoice);
  writeJSON("invoices.json", invoices);
  res.status(201).json(invoice);
});

// PUT /api/invoices/:id - modifier une facture (statut, notes, lignes...)
router.put("/:id", requireAuth, requireRole(...CAN_MANAGE), (req, res) => {
  const invoices = readJSON("invoices.json", []);
  const invoice = invoices.find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: "Facture introuvable." });

  const { client, items, statut, notes } = req.body || {};
  if (client) invoice.client = client;
  if (items) invoice.items = items;
  if (statut) invoice.statut = statut === "payée" ? "payée" : "en attente";
  if (notes != null) invoice.notes = notes;

  writeJSON("invoices.json", invoices);
  res.json(invoice);
});

// DELETE /api/invoices/:id - supprimer une facture
router.delete("/:id", requireAuth, requireRole(...CAN_MANAGE), (req, res) => {
  const invoices = readJSON("invoices.json", []);
  const remaining = invoices.filter((i) => i.id !== req.params.id);
  if (remaining.length === invoices.length) {
    return res.status(404).json({ error: "Facture introuvable." });
  }
  writeJSON("invoices.json", remaining);
  res.json({ ok: true });
});

module.exports = router;
