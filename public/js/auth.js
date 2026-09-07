// Protège une page admin : redirige vers /login.html si non connecté,
// et optionnellement restreint l'accès à certains rôles.
async function protegerPage(rolesAutorises) {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) throw new Error("non connecté");
    const user = await res.json();

    if (rolesAutorises && !rolesAutorises.includes(user.role)) {
      document.body.innerHTML =
        '<div style="padding:60px;text-align:center;font-family:sans-serif;">' +
        "<h1>Accès restreint</h1><p>Votre rôle ne permet pas d'accéder à cette page.</p>" +
        '<a href="/admin/dashboard.html">Retour au tableau de bord</a></div>';
      throw new Error("rôle non autorisé");
    }

    const nomEl = document.querySelector("[data-champ='utilisateur-nom']");
    const roleEl = document.querySelector("[data-champ='utilisateur-role']");
    if (nomEl) nomEl.textContent = user.username;
    if (roleEl) roleEl.textContent = libelleRole(user.role);

    return user;
  } catch (e) {
    window.location.href = "/login.html";
    return null;
  }
}

function libelleRole(role) {
  return { admin: "Administrateur", gerant: "Gérant", employe: "Employé" }[role] || role;
}

function initDeconnexion() {
  const btn = document.querySelector("#btn-deconnexion");
  if (btn) {
    btn.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login.html";
    });
  }
}
