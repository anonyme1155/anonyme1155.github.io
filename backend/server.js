const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const crypto = require("crypto");

const { readJSON, writeJSON } = require("./utils/store");
const { hashPassword } = require("./utils/password");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const invoicesRoutes = require("./routes/invoices");
const contentRoutes = require("./routes/content");
const messagesRoutes = require("./routes/messages");

const PORT = process.env.PORT || 3000;

// --- Initialisation du compte admin par défaut au premier démarrage ---
function seedAdminIfNeeded() {
  const users = readJSON("users.json", []);
  if (users.length === 0) {
    const { salt, hash } = hashPassword("1234");
    users.push({
      id: crypto.randomUUID(),
      username: "admin",
      salt,
      hash,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    writeJSON("users.json", users);
    console.log("Compte admin créé automatiquement : identifiant 'admin' / mot de passe '1234'.");
    console.log("⚠️  Pensez à changer ce mot de passe depuis le back-office dès la première connexion.");
  }
}
seedAdminIfNeeded();
readJSON("invoices.json", []);
readJSON("sessions.json", []);

// --- App Express ---
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/messages", messagesRoutes);

// Site statique (vitrine + back-office)
app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(PORT, () => {
  console.log(`Site Il Ponte lancé sur http://localhost:${PORT}`);
});
