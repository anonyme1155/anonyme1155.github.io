// --- Avertissement si le site est ouvert directement (file://) sans le serveur Node ---
(function avertirSiFichierLocal() {
  if (window.location.protocol === "file:") {
    document.addEventListener("DOMContentLoaded", () => {
      const banniere = document.createElement("div");
      banniere.className = "avertissement-local";
      banniere.innerHTML =
        "Vous ouvrez ce fichier directement depuis votre ordinateur : le site n'aura ni style ni fonctionnalités. " +
        "Lancez le serveur (<code>npm install</code> puis <code>npm start</code> dans le dossier <code>backend</code>) " +
        "et ouvrez <code>http://localhost:3000</code>.";
      document.body.prepend(banniere);
    });
  }
})();

// --- Menu mobile ---
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("ouvert"));
  }
});

// --- Récupération du contenu du site (mis à jour par le back-office) ---
async function chargerContenu() {
  const res = await fetch("/api/content");
  if (!res.ok) return null;
  return res.json();
}

// --- Page d'accueil ---
async function initAccueil() {
  const content = await chargerContenu();
  if (!content) return;
  const setText = (sel, val) => {
    const el = document.querySelector(sel);
    if (el && val != null) el.textContent = val;
  };
  setText("[data-champ='hero-titre']", content.hero?.titre);
  setText("[data-champ='hero-soustitre']", content.hero?.sousTitre);
  setText("[data-champ='hero-bouton']", content.hero?.texteBouton);
  setText("[data-champ='apropos-titre']", content.apropos?.titre);
  setText("[data-champ='apropos-texte']", content.apropos?.texte);
}

// --- Page carte / menu ---
async function initMenu() {
  const content = await chargerContenu();
  if (!content) return;
  const conteneur = document.querySelector("[data-champ='menu-liste']");
  if (!conteneur) return;
  conteneur.innerHTML = "";
  (content.menu || []).forEach((cat) => {
    const bloc = document.createElement("div");
    bloc.className = "menu-categorie";
    const titre = document.createElement("h3");
    titre.textContent = cat.categorie;
    bloc.appendChild(titre);
    cat.plats.forEach((plat) => {
      const ligne = document.createElement("div");
      ligne.className = "menu-item";
      ligne.innerHTML = `
        <span class="nom">${plat.nom}</span>
        <span class="leader"></span>
        <span class="prix">${Number(plat.prix).toFixed(2)} €</span>
      `;
      bloc.appendChild(ligne);
    });
    conteneur.appendChild(bloc);
  });
}

// --- Page contact ---
async function initContact() {
  const content = await chargerContenu();
  if (content) {
    const setText = (sel, val) => {
      const el = document.querySelector(sel);
      if (el && val != null) el.textContent = val;
    };
    setText("[data-champ='contact-adresse']", content.contact?.adresse);
    setText("[data-champ='contact-telephone']", content.contact?.telephone);
    setText("[data-champ='contact-email']", content.contact?.email);

    const horairesListe = document.querySelector("[data-champ='horaires-liste']");
    if (horairesListe) {
      horairesListe.innerHTML = "";
      (content.horaires || []).forEach((h) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${h.jour}</span><span>${h.heures}</span>`;
        horairesListe.appendChild(li);
      });
    }
  }

  const form = document.querySelector("#form-contact");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const messageEl = document.querySelector("#form-message");
      const data = {
        nom: form.nom.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim(),
      };
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        messageEl.textContent = "Votre message a bien été envoyé, merci !";
        messageEl.className = "form-message succes";
        form.reset();
      } catch {
        messageEl.textContent = "Une erreur est survenue, merci de réessayer.";
        messageEl.className = "form-message erreur";
      }
    });
  }
}
