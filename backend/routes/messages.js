const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/store");
const { requireAuth, requireRole } = require("../middleware/auth");

// POST /api/messages - envoi public depuis le formulaire de contact
router.post("/", (req, res) => {
  const { nom, email, message } = req.body || {};
  if (!nom || !email || !message) {
    return res.status(400).json({ error: "Nom, email et message sont requis." });
  }
  const messages = readJSON("messages.json", []);
  messages.push({
    id: crypto.randomUUID(),
    nom,
    email,
    message,
    lu: false,
    date: new Date().toISOString(),
  });
  writeJSON("messages.json", messages);
  res.status(201).json({ ok: true });
});

// GET /api/messages - lecture réservée à l'équipe connectée
router.get("/", requireAuth, requireRole("admin", "gerant", "employe"), (req, res) => {
  const messages = readJSON("messages.json", []);
  res.json(messages.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// PUT /api/messages/:id/lu - marquer comme lu
router.put("/:id/lu", requireAuth, requireRole("admin", "gerant", "employe"), (req, res) => {
  const messages = readJSON("messages.json", []);
  const msg = messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: "Message introuvable." });
  msg.lu = true;
  writeJSON("messages.json", messages);
  res.json(msg);
});

// DELETE /api/messages/:id
router.delete("/:id", requireAuth, requireRole("admin", "gerant"), (req, res) => {
  const messages = readJSON("messages.json", []).filter((m) => m.id !== req.params.id);
  writeJSON("messages.json", messages);
  res.json({ ok: true });
});

module.exports = router;
