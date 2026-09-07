const express = require("express");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/store");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/content - public, utilisé par le site vitrine
router.get("/", (req, res) => {
  res.json(readJSON("content.json", {}));
});

// PUT /api/content - modification du contenu (admin et gérant)
router.put("/", requireAuth, requireRole("admin", "gerant"), (req, res) => {
  const current = readJSON("content.json", {});
  const updated = { ...current, ...req.body };
  writeJSON("content.json", updated);
  res.json(updated);
});

module.exports = router;
