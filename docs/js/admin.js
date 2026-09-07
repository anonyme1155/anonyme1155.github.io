// --- Utilitaires ---
function toast(message, erreur = false) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = "toast visible" + (erreur ? " erreur" : "");
  setTimeout(() => el.classList.remove("visible"), 3500);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

function badgeRole(role) {
  const labels = { admin: "Administrateur", gerant: "Gérant", employe: "Employé" };
  return `<span class="badge badge-${role}">${labels[role] || role}</span>`;
}

// ==========================================================
// TABLEAU DE BORD
// ==========================================================
async function initDashboard(user) {
  try {
    const [invoices, messages] = await Promise.all([
      api("/api/invoices").catch(() => []),
      api("/api/messages").catch(() => []),
    ]);

    const totalCA = invoices
      .filter((i) => i.statut === "payée")
      .reduce((sum, i) => sum + i.items.reduce((s, it) => s + it.quantite * it.prixUnitaire, 0), 0);
    const enAttente = invoices.filter((i) => i.statut === "en attente").length;
    const messagesNonLus = messages.filter((m) => !m.lu).length;

    document.querySelector("#stat-factures").textContent = invoices.length;
    document.querySelector("#stat-ca").textContent = totalCA.toFixed(2) + " €";
    document.querySelector("#stat-attente").textContent = enAttente;
    document.querySelector("#stat-messages").textContent = messagesNonLus;

    const recentes = invoices.slice(0, 5);
    const corps = document.querySelector("#dashboard-factures-recentes");
    corps.innerHTML = recentes.length
      ? recentes.map((i) => `
        <tr>
          <td>${i.numero}</td>
          <td>${i.client.nom}</td>
          <td>${new Date(i.date).toLocaleDateString("fr-FR")}</td>
          <td><span class="badge badge-${i.statut === "payée" ? "payee" : "attente"}">${i.statut}</span></td>
        </tr>
      `).join("")
      : `<tr><td colspan="4" class="vide">Aucune facture pour le moment.</td></tr>`;

    const messagesRecents = messages.slice(0, 5);
    const corpsMsg = document.querySelector("#dashboard-messages-recents");
    if (corpsMsg) {
      corpsMsg.innerHTML = messagesRecents.length
        ? messagesRecents.map((m) => `
          <tr>
            <td>${m.nom}</td>
            <td>${m.email}</td>
            <td>${new Date(m.date).toLocaleDateString("fr-FR")}</td>
            <td>${m.lu ? "Lu" : "<strong>Non lu</strong>"}</td>
          </tr>
        `).join("")
        : `<tr><td colspan="4" class="vide">Aucun message pour le moment.</td></tr>`;
    }
  } catch (e) {
    toast(e.message, true);
  }
}

// ==========================================================
// UTILISATEURS
// ==========================================================
async function chargerUtilisateurs() {
  const users = await api("/api/users");
  const corps = document.querySelector("#table-utilisateurs");
  corps.innerHTML = users.length
    ? users.map((u) => `
      <tr>
        <td>${u.username}</td>
        <td>${badgeRole(u.role)}</td>
        <td>${new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
        <td class="table-actions">
          <select data-action="role" data-id="${u.id}" class="btn-small">
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Administrateur</option>
            <option value="gerant" ${u.role === "gerant" ? "selected" : ""}>Gérant</option>
            <option value="employe" ${u.role === "employe" ? "selected" : ""}>Employé</option>
          </select>
          <button class="btn btn-small btn-danger" data-action="supprimer" data-id="${u.id}">Supprimer</button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="vide">Aucun utilisateur.</td></tr>`;

  corps.querySelectorAll("[data-action='role']").forEach((select) => {
    select.addEventListener("change", async () => {
      try {
        await api(`/api/users/${select.dataset.id}/role`, {
          method: "PUT",
          body: JSON.stringify({ role: select.value }),
        });
        toast("Rôle mis à jour.");
        chargerUtilisateurs();
      } catch (e) {
        toast(e.message, true);
        chargerUtilisateurs();
      }
    });
  });

  corps.querySelectorAll("[data-action='supprimer']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Supprimer ce compte ? Cette action est définitive.")) return;
      try {
        await api(`/api/users/${btn.dataset.id}`, { method: "DELETE" });
        toast("Compte supprimé.");
        chargerUtilisateurs();
      } catch (e) {
        toast(e.message, true);
      }
    });
  });
}

async function initUtilisateurs() {
  await chargerUtilisateurs();
  const form = document.querySelector("#form-nouvel-utilisateur");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({
          username: form.username.value.trim(),
          password: form.password.value,
          role: form.role.value,
        }),
      });
      toast("Compte créé.");
      form.reset();
      chargerUtilisateurs();
    } catch (e) {
      toast(e.message, true);
    }
  });
}

// ==========================================================
// FACTURES
// ==========================================================
let compteurLignes = 0;

function ajouterLigneFacture(conteneur, valeurs = {}) {
  compteurLignes++;
  const div = document.createElement("div");
  div.className = "ligne-facture";
  div.dataset.ligneId = compteurLignes;
  div.innerHTML = `
    <input type="text" placeholder="Description" class="champ-description" value="${valeurs.description || ""}" required />
    <input type="number" placeholder="Qté" min="1" step="1" class="champ-quantite" value="${valeurs.quantite || 1}" required />
    <input type="number" placeholder="Prix unitaire (€)" min="0" step="0.01" class="champ-prix" value="${valeurs.prixUnitaire || ""}" required />
    <button type="button" class="lien-supprimer" title="Supprimer la ligne">✕</button>
  `;
  div.querySelector(".lien-supprimer").addEventListener("click", () => div.remove());
  conteneur.appendChild(div);
}

async function chargerFactures() {
  const factures = await api("/api/invoices");
  const corps = document.querySelector("#table-factures");
  corps.innerHTML = factures.length
    ? factures.map((f) => {
        const total = f.items.reduce((s, it) => s + it.quantite * it.prixUnitaire, 0);
        return `
      <tr>
        <td>${f.numero}</td>
        <td>${f.client.nom}</td>
        <td>${new Date(f.date).toLocaleDateString("fr-FR")}</td>
        <td>${total.toFixed(2)} €</td>
        <td><span class="badge badge-${f.statut === "payée" ? "payee" : "attente"}">${f.statut}</span></td>
        <td class="table-actions">
          <a class="btn btn-small btn-outline" href="/api/invoices/${f.id}/pdf" target="_blank">PDF</a>
          <button class="btn btn-small" data-action="basculer-statut" data-id="${f.id}" data-statut="${f.statut}">
            ${f.statut === "payée" ? "Marquer en attente" : "Marquer payée"}
          </button>
          <button class="btn btn-small btn-danger" data-action="supprimer-facture" data-id="${f.id}">Supprimer</button>
        </td>
      </tr>
    `;
      }).join("")
    : `<tr><td colspan="6" class="vide">Aucune facture pour le moment.</td></tr>`;

  corps.querySelectorAll("[data-action='basculer-statut']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const nouveauStatut = btn.dataset.statut === "payée" ? "en attente" : "payée";
      try {
        await api(`/api/invoices/${btn.dataset.id}`, {
          method: "PUT",
          body: JSON.stringify({ statut: nouveauStatut }),
        });
        toast("Statut mis à jour.");
        chargerFactures();
      } catch (e) {
        toast(e.message, true);
      }
    });
  });

  corps.querySelectorAll("[data-action='supprimer-facture']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Supprimer cette facture ?")) return;
      try {
        await api(`/api/invoices/${btn.dataset.id}`, { method: "DELETE" });
        toast("Facture supprimée.");
        chargerFactures();
      } catch (e) {
        toast(e.message, true);
      }
    });
  });
}

async function initFactures() {
  await chargerFactures();

  const conteneurLignes = document.querySelector("#lignes-facture");
  ajouterLigneFacture(conteneurLignes);
  document.querySelector("#btn-ajouter-ligne").addEventListener("click", () => ajouterLigneFacture(conteneurLignes));

  const form = document.querySelector("#form-nouvelle-facture");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const items = Array.from(conteneurLignes.querySelectorAll(".ligne-facture")).map((ligne) => ({
      description: ligne.querySelector(".champ-description").value.trim(),
      quantite: Number(ligne.querySelector(".champ-quantite").value),
      prixUnitaire: Number(ligne.querySelector(".champ-prix").value),
    }));

    if (items.length === 0) {
      toast("Ajoutez au moins une ligne à la facture.", true);
      return;
    }

    try {
      await api("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          client: {
            nom: form.clientNom.value.trim(),
            adresse: form.clientAdresse.value.trim(),
            email: form.clientEmail.value.trim(),
          },
          items,
          statut: form.statut.value,
          notes: form.notes.value.trim(),
        }),
      });
      toast("Facture créée.");
      form.reset();
      conteneurLignes.innerHTML = "";
      ajouterLigneFacture(conteneurLignes);
      chargerFactures();
    } catch (e) {
      toast(e.message, true);
    }
  });
}

// ==========================================================
// CONTENU DU SITE
// ==========================================================
async function initContenu() {
  const content = await api("/api/content");
  const form = document.querySelector("#form-contenu");

  form.heroTitre.value = content.hero?.titre || "";
  form.heroSousTitre.value = content.hero?.sousTitre || "";
  form.heroBouton.value = content.hero?.texteBouton || "";
  form.aproposTitre.value = content.apropos?.titre || "";
  form.aproposTexte.value = content.apropos?.texte || "";
  form.contactAdresse.value = content.contact?.adresse || "";
  form.contactTelephone.value = content.contact?.telephone || "";
  form.contactEmail.value = content.contact?.email || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/content", {
        method: "PUT",
        body: JSON.stringify({
          hero: {
            ...content.hero,
            titre: form.heroTitre.value.trim(),
            sousTitre: form.heroSousTitre.value.trim(),
            texteBouton: form.heroBouton.value.trim(),
          },
          apropos: {
            titre: form.aproposTitre.value.trim(),
            texte: form.aproposTexte.value.trim(),
          },
          contact: {
            adresse: form.contactAdresse.value.trim(),
            telephone: form.contactTelephone.value.trim(),
            email: form.contactEmail.value.trim(),
          },
        }),
      });
      toast("Contenu du site mis à jour.");
    } catch (e) {
      toast(e.message, true);
    }
  });

  // Gestion des horaires
  const conteneurHoraires = document.querySelector("#horaires-edit");
  (content.horaires || []).forEach((h) => {
    const div = document.createElement("div");
    div.className = "ligne-facture";
    div.style.gridTemplateColumns = "1fr 2fr auto";
    div.innerHTML = `
      <input type="text" class="champ-jour" value="${h.jour}" />
      <input type="text" class="champ-heures" value="${h.heures}" />
      <span></span>
    `;
    conteneurHoraires.appendChild(div);
  });
  const formHoraires = document.querySelector("#form-horaires");
  formHoraires.addEventListener("submit", async (e) => {
    e.preventDefault();
    const horaires = Array.from(conteneurHoraires.querySelectorAll(".ligne-facture")).map((div) => ({
      jour: div.querySelector(".champ-jour").value.trim(),
      heures: div.querySelector(".champ-heures").value.trim(),
    }));
    try {
      await api("/api/content", { method: "PUT", body: JSON.stringify({ horaires }) });
      toast("Horaires mis à jour.");
    } catch (e2) {
      toast(e2.message, true);
    }
  });

  // Gestion de la carte / menu
  const conteneurMenu = document.querySelector("#menu-edit");
  function rendreCategorie(cat) {
    const bloc = document.createElement("div");
    bloc.className = "panel";
    bloc.style.marginBottom = "16px";
    bloc.innerHTML = `
      <div class="form-row" style="margin-bottom:12px;">
        <input type="text" class="champ-categorie" value="${cat.categorie}" placeholder="Nom de la catégorie" />
        <button type="button" class="btn btn-small btn-danger btn-suppr-categorie">Supprimer la catégorie</button>
      </div>
      <div class="plats"></div>
      <button type="button" class="btn btn-small btn-outline btn-ajouter-plat">+ Ajouter un plat</button>
    `;
    const platsEl = bloc.querySelector(".plats");
    function rendrePlat(plat = { nom: "", prix: "" }) {
      const ligne = document.createElement("div");
      ligne.className = "ligne-facture";
      ligne.style.gridTemplateColumns = "3fr 1fr auto";
      ligne.innerHTML = `
        <input type="text" class="champ-plat-nom" value="${plat.nom}" placeholder="Nom du plat" />
        <input type="number" step="0.01" class="champ-plat-prix" value="${plat.prix}" placeholder="Prix" />
        <button type="button" class="lien-supprimer">✕</button>
      `;
      ligne.querySelector(".lien-supprimer").addEventListener("click", () => ligne.remove());
      platsEl.appendChild(ligne);
    }
    (cat.plats || []).forEach(rendrePlat);
    bloc.querySelector(".btn-ajouter-plat").addEventListener("click", () => rendrePlat());
    bloc.querySelector(".btn-suppr-categorie").addEventListener("click", () => bloc.remove());
    conteneurMenu.appendChild(bloc);
  }
  (content.menu || []).forEach(rendreCategorie);
  document.querySelector("#btn-ajouter-categorie").addEventListener("click", () => rendreCategorie({ categorie: "", plats: [] }));

  document.querySelector("#form-menu").addEventListener("submit", async (e) => {
    e.preventDefault();
    const menu = Array.from(conteneurMenu.children).map((bloc) => ({
      categorie: bloc.querySelector(".champ-categorie").value.trim(),
      plats: Array.from(bloc.querySelectorAll(".plats .ligne-facture")).map((l) => ({
        nom: l.querySelector(".champ-plat-nom").value.trim(),
        prix: Number(l.querySelector(".champ-plat-prix").value) || 0,
      })),
    }));
    try {
      await api("/api/content", { method: "PUT", body: JSON.stringify({ menu }) });
      toast("Carte mise à jour.");
    } catch (e2) {
      toast(e2.message, true);
    }
  });
}

// ==========================================================
// MESSAGES
// ==========================================================
async function initMessages() {
  const messages = await api("/api/messages");
  const corps = document.querySelector("#table-messages");
  corps.innerHTML = messages.length
    ? messages.map((m) => `
      <tr>
        <td>${m.nom}</td>
        <td>${m.email}</td>
        <td>${m.message}</td>
        <td>${new Date(m.date).toLocaleDateString("fr-FR")}</td>
        <td class="table-actions">
          <button class="btn btn-small btn-danger" data-action="supprimer-message" data-id="${m.id}">Supprimer</button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="5" class="vide">Aucun message.</td></tr>`;

  corps.querySelectorAll("[data-action='supprimer-message']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Supprimer ce message ?")) return;
      await api(`/api/messages/${btn.dataset.id}`, { method: "DELETE" });
      initMessages();
    });
  });

  messages.filter((m) => !m.lu).forEach((m) => api(`/api/messages/${m.id}/lu`, { method: "PUT" }).catch(() => {}));
}
