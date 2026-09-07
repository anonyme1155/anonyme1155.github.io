// Stockage simple sur fichiers JSON. Suffisant pour un petit établissement,
// aucune base de données externe à installer.
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

function ensureFile(fileName, defaultValue) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
  }
  return filePath;
}

function readJSON(fileName, defaultValue) {
  const filePath = ensureFile(fileName, defaultValue);
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

function writeJSON(fileName, data) {
  const filePath = ensureFile(fileName, data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = { readJSON, writeJSON };
