const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/store");
const { hashPassword } = require("../utils/password");
const { requireAuth, requireRole } = require("../middleware/auth");

const ROLES = ["admin", "gerant", "employe"];

function publicUser(u) {
  return { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
}

// GET /api/users - liste des comptes (admin uniquement)
router.get("/", requireAuth, requireRole("admin"), (req, res) => {
  const users = readJSON("users.json", []);
  res.json(users.map(publicUser));
});

// POST /api/users - créer un compte (admin uniquement)
router.post("/", requireAuth, requireRole("admin"), (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis." });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 4 caractères." });
  }
  const finalRole = role && ROLES.includes(role) ? role : "employe";

  const users = readJSON("users.json", []);
  if (users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
    return res.status(409).json({ error: "Cet identifiant est déjà utilisé." });
  }

  const { salt, hash } = hashPassword(password);
  const newUser = {
    id: crypto.randomUUID(),
    username,
    salt,
    hash,
    role: finalRole,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeJSON("users.json", users);

  res.status(201).json(publicUser(newUser));
});

// PUT /api/users/:id/role - changer le rôle d'un compte (admin uniquement)
router.put("/:id/role", requireAuth, requireRole("admin"), (req, res) => {
  const { role } = req.body || {};
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `Rôle invalide. Rôles possibles : ${ROLES.join(", ")}.` });
  }

  const users = readJSON("users.json", []);
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (user.role === "admin" && role !== "admin") {
    const nbAdmins = users.filter((u) => u.role === "admin").length;
    if (nbAdmins <= 1) {
      return res.status(400).json({ error: "Impossible de retirer le rôle admin : c'est le dernier compte administrateur." });
    }
  }

  user.role = role;
  writeJSON("users.json", users);
  res.json(publicUser(user));
});

// DELETE /api/users/:id - supprimer un compte (admin uniquement)
router.delete("/:id", requireAuth, requireRole("admin"), (req, res) => {
  const users = readJSON("users.json", []);
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (user.id === req.user.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
  }
  if (user.role === "admin") {
    const nbAdmins = users.filter((u) => u.role === "admin").length;
    if (nbAdmins <= 1) {
      return res.status(400).json({ error: "Impossible de supprimer le dernier compte administrateur." });
    }
  }

  const remaining = users.filter((u) => u.id !== req.params.id);
  writeJSON("users.json", remaining);

  // On invalide aussi les sessions de ce compte
  const sessions = readJSON("sessions.json", []).filter((s) => s.userId !== req.params.id);
  writeJSON("sessions.json", sessions);

  res.json({ ok: true });
});

module.exports = router;
