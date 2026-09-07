const { readJSON, writeJSON } = require("../utils/store");

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 heures

function cleanExpiredSessions() {
  const sessions = readJSON("sessions.json", []);
  const now = Date.now();
  const valid = sessions.filter((s) => s.expiresAt > now);
  if (valid.length !== sessions.length) writeJSON("sessions.json", valid);
  return valid;
}

// Vérifie que la personne est connectée
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.session;
  if (!token) return res.status(401).json({ error: "Non authentifié." });

  const sessions = cleanExpiredSessions();
  const session = sessions.find((s) => s.token === token);
  if (!session) return res.status(401).json({ error: "Session expirée, merci de vous reconnecter." });

  const users = readJSON("users.json", []);
  const user = users.find((u) => u.id === session.userId);
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable." });

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

// Vérifie que la personne a l'un des rôles autorisés
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Vous n'avez pas les droits nécessaires pour cette action." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, SESSION_DURATION_MS, cleanExpiredSessions };
