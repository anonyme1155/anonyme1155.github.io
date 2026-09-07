const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { readJSON, writeJSON } = require("../utils/store");
const { verifyPassword } = require("../utils/password");
const { requireAuth, SESSION_DURATION_MS, cleanExpiredSessions } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis." });
  }

  const users = readJSON("users.json", []);
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());

  if (!user || !verifyPassword(password, user.salt, user.hash)) {
    return res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
  }

  const sessions = cleanExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  sessions.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  });
  writeJSON("sessions.json", sessions);

  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS,
  });

  res.json({ id: user.id, username: user.username, role: user.role });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const token = req.cookies && req.cookies.session;
  if (token) {
    const sessions = readJSON("sessions.json", []).filter((s) => s.token !== token);
    writeJSON("sessions.json", sessions);
  }
  res.clearCookie("session");
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
