# Il Ponte — Site du restaurant italien (Perpignan)

Site complet pour un restaurant italien : vitrine publique + back-office pour la gestion
des factures, du contenu du site et des comptes utilisateurs.

## Ce que contient le site

**Côté public**
- Page d'accueil, page "La carte", page "Notre histoire", page "Contact" (avec formulaire de message)
- Design propre à la trattoria (pas un template générique), responsive mobile

**Côté back-office** (`/login.html`)
- Tableau de bord (chiffre d'affaires, factures en attente, messages non lus)
- **Facturation** : création de factures avec plusieurs lignes, statut payée/en attente,
  génération d'un **PDF** téléchargeable pour chaque facture
- **Messages** : lecture des messages envoyés depuis le formulaire de contact
- **Contenu du site** : modification des textes de l'accueil, des horaires et de la carte,
  sans toucher au code
- **Utilisateurs** : création de comptes, suppression, **changement de rôle**

### Rôles disponibles
| Rôle | Droits |
|---|---|
| `admin` (administrateur) | Accès complet : factures, contenu, gestion des utilisateurs |
| `gerant` (gérant) | Factures + contenu du site (pas la gestion des comptes) |
| `employe` (employé) | Consultation des factures et des messages uniquement |

Un compte administrateur est créé automatiquement au premier démarrage :
- **Identifiant : `admin`**
- **Mot de passe : `1234`**

⚠️ **Changez ce mot de passe dès la première connexion** (créez un nouveau compte admin avec
un mot de passe fort depuis la page "Utilisateurs", ou a minima ne laissez pas `1234` en
production — c'est un mot de passe volontairement simple pour le premier lancement).

## Installation

Prérequis : [Node.js](https://nodejs.org) (version 18 ou plus récente).

```bash
cd backend
npm install
npm start
```

Le site est alors accessible sur **http://localhost:3000**.
Le back-office est sur **http://localhost:3000/login.html**.

Pour le développement (redémarrage automatique du serveur à chaque modification) :
```bash
npm run dev
```

## Structure du projet

```
cafe-italien-perpignan/
├── backend/
│   ├── server.js              → point d'entrée du serveur
│   ├── data/                  → toutes les données (JSON), créées automatiquement
│   │   ├── users.json         → comptes utilisateurs
│   │   ├── invoices.json      → factures
│   │   ├── content.json       → contenu du site (textes, horaires, carte)
│   │   └── messages.json      → messages de contact
│   ├── routes/                → les routes de l'API (auth, users, invoices, content, messages)
│   ├── middleware/auth.js     → vérification de connexion et des rôles
│   └── utils/                 → hachage des mots de passe, génération de PDF, stockage
└── public/                    → le site lui-même (pages HTML, CSS, JS)
    ├── index.html, menu.html, apropos.html, contact.html, login.html
    ├── admin/                 → pages du back-office
    ├── css/ et js/
```

## Où sont stockées les données ?

Tout est stocké dans de simples fichiers JSON dans `backend/data/`. C'est volontairement
simple (aucune base de données à installer ou configurer) et suffisant pour un seul
établissement. **Pensez à sauvegarder régulièrement ce dossier `backend/data/`** (copie sur
une clé USB, cloud, etc.) : c'est là que vivent toutes les factures et tous les comptes.

## Déploiement en ligne

Pour rendre le site accessible sur Internet (et pas seulement en local), il faut héberger ce
serveur Node.js chez un hébergeur (par exemple un petit VPS, Railway, Render, ou un hébergeur
mutualisé compatible Node.js). La configuration à retenir :
- Démarrage : `npm install && npm start`
- Le serveur écoute sur le port défini par la variable d'environnement `PORT` (par défaut 3000)
- Pensez à activer HTTPS chez votre hébergeur (obligatoire pour que la connexion au
  back-office reste sécurisée)

## Personnalisation

- **Logo / photos** : le dossier `public/images/` est prévu pour vos photos. Ajoutez vos
  images puis mettez à jour les balises `<img>` ou les blocs `.hero-visual` /
  `.apropos-visual` dans le CSS (`public/css/style.css`) pour les afficher à la place des
  aplats de couleur.
- **Couleurs et polices** : modifiables en haut du fichier `public/css/style.css` (variables
  `--vert-basilic`, `--rouge-tomate`, etc.).
- **Textes, horaires, carte** : tout se modifie depuis le back-office, page "Contenu du site" —
  aucune intervention technique nécessaire au quotidien.
