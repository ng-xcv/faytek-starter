# CLAUDE.md — Faytek Starter (Vision Globale)

> Starter officiel FaytekDev — template QHSE.
> Application SPA full-stack pour la gestion des non-conformités, processus et plans d'actions.

---

## Objectif

Ce starter est le **template de référence Faytek Solution** pour tout nouveau projet QHSE full-stack.

Modules métier embarqués : **NC** (Non-Conformités), **Process** (Processus), **PA** (Plans d'Actions), **Admin** (Utilisateurs, Profils, Directions, Paramétrage).

---

## Stack Technique

### Backend

| Technologie        | Version | Rôle                             |
| ------------------ | ------- | -------------------------------- |
| Node.js            | ≥ 18.x  | Runtime                          |
| Express            | ^4.x    | Framework HTTP                   |
| Mongoose           | ^8.x    | ODM MongoDB                      |
| jsonwebtoken       | ^9.x    | Auth JWT                         |
| bcrypt             | ^5.x    | Hash mots de passe               |
| helmet             | ^7.x    | Headers HTTP de sécurité         |
| express-rate-limit | ^7.x    | Rate limiting                    |
| cookie-parser      | ^1.4.x  | Cookies httpOnly                 |
| Joi                | ^17.x   | Validation                       |
| Multer             | ^1.x    | Upload fichiers                  |
| dotenv             | ^16.x   | Variables d'environnement        |
| cors               | ^2.8.x  | CORS (credentials: true)         |
| nodemailer         | ^6.x    | Emails                           |
| exceljs / xlsx     | ^0.18.x | Export Excel                     |

### Frontend

| Technologie             | Version | Rôle                              |
| ----------------------- | ------- | --------------------------------- |
| Vite                    | ^5.x    | Bundler                           |
| React                   | ^18.x   | UI Framework (JS, pas TypeScript) |
| React Router DOM        | ^6.x    | Routing (lazy + Suspense)         |
| MUI (Material UI)       | ^5.x    | UI Library                        |
| @emotion/react + styled | ^11.x   | CSS-in-JS                         |
| Redux Toolkit           | ^2.x    | État global                       |
| redux-persist           | ^6.x    | Persistance Redux                 |
| react-hook-form + Yup   | ^7.x    | Formulaires + validation          |
| Axios                   | ^1.x    | HTTP client + intercepteurs JWT   |
| @iconify/react          | ^4.x    | Icônes                            |
| framer-motion           | ^10.x   | Animations                        |
| recharts                | ^3.x    | Graphiques                        |
| notistack               | ^3.x    | Snackbars                         |
| date-fns + dayjs        | ^2/^1   | Dates (locale FR)                 |
| simplebar-react         | ^3.x    | Scrollbar custom                  |

---

## Architecture Globale

```
faytek-starter/
├── backend/                    ← API Express / MongoDB
│   ├── index.js
│   ├── middleware/verifyToken.js
│   ├── constants/permissions.js
│   ├── models/                 (User, Profil, NonConformite, Process, Instance, Action, Settings)
│   ├── routes/                 (auth, user, profil, nonConformite, process, pa, settings)
│   ├── scripts/                (seedAdmin, seedProfils, seedSettings)
│   ├── uploads/
│   └── CLAUDE.md
│
├── frontend/                   ← SPA React / Vite
│   ├── src/
│   │   ├── main.jsx / App.jsx
│   │   ├── config.js
│   │   ├── components/         (hook-form, CanAccess, Iconify, Label, LoadingScreen, Scrollbar)
│   │   ├── contexts/           (AuthContext, PermissionsContext)
│   │   ├── guards/             (AuthGuard, GuestGuard, ModuleGuard, ModuleAccessGuard)
│   │   ├── hooks/              (useAuth, useResponsive, useDesktopNotifications)
│   │   ├── layouts/dashboard/  (index, header, navbar)
│   │   ├── pages/              (auth, dashboard, nonConformite, process, instance, action,
│   │   │                        utilisateur, profil, referentiel, admin, SelectModule)
│   │   ├── redux/              (store, rootReducer, slices)
│   │   ├── routes/             (index.jsx, paths.js)
│   │   ├── theme/              (palette, typography, shadows)
│   │   └── utils/              (axios, jwt, formatNumber)
│   └── CLAUDE.md
│
└── README.md
```

---

## Modules & Routes Principales

### Authentification & Sélection

- `/auth/login`
- `/select-module` — choix parmi les modules activés (NC, Process, PA, Paramétrage)

### Module NC (Non-Conformités — QHSE)

- `/dashboard/non-conformite/list`
- `/dashboard/non-conformite/new` — wizard 3 étapes (Contexte / Constat / Preuves)
- `/dashboard/non-conformite/:id` — fiche détail (stepper + onglets Contexte / Dispatch / Analyse causes / Actions / Clôture)
- Workflow : **Déclarée → Dispatchée → En traitement → Prête à clôturer → Clôturée**
- SLA : dispatch 48h, traitement 7j, clôture 72h (configurables)
- Analyse causes : 5M / Ishikawa / 5 Pourquoi
- Export Excel

### Module Réclamation Client

- `/dashboard/reclamation/list`
- `/dashboard/reclamation/new` — wizard 4 étapes (Source / Client / Réclamation / Récap)
- `/dashboard/reclamation/:id` — fiche détail avec 7 onglets : Contexte / Dispatch / Réponses client / Analyse causes / Plan d'action / Retour & efficacité / Clôture & enquête
- Workflow : **Déclarée → Dispatchée → Répondue → Analyse causes → Plan d'action → Prête à clôturer → Clôturée → Enquête envoyée → Enquête reçue**
- Sources : Employé, Call, Mail, SMS, WhatsApp
- SLA : dispatch 24h, réponse 48h, traitement 7j, clôture 72h (configurables via `RC_SLA_*_HOURS`)
- Enquête de satisfaction post-clôture par email + lien public (token unique)
- Analyse causes : 5M / Ishikawa / 5 Pourquoi (composants partagés avec NC)
- Export Excel

### Module Process (Référentiel QHSE)

- `/dashboard/process/list` — CRUD inline (code unique, nom, description, pilote, actif)

### Module PA (Plan d'Actions)

- `/dashboard/instance/list` — instances (containers d'actions)
- `/dashboard/instance/:id/action` — actions d'une instance
- `/dashboard/action/list` — toutes les actions (+ provenance vers la NC source si applicable)

### Paramétrage & Administration

- `/dashboard/settings` — infos société, couleurs, logo/favicon (Cloudinary) — permission `admin.gererParams`
- `/dashboard/utilisateur/list` — gestion utilisateurs
- `/dashboard/profil/list` — gestion profils & permissions
- `/dashboard/direction/list` — directions

---

## State Management (Redux Toolkit)

Slices actifs : `module`, `referentiel` (users / directions / profils), `notification`, `nc`, `rc`, `process`, `pa`, `diagnostic`, `settings`.

Pattern : `createAsyncThunk` pour les appels API. Store persisté via `redux-persist` (clé `tsSiens`, localStorage).

---

## Authentification & Permissions

- JWT en cookies httpOnly (access 15 min + refresh 7 j) avec rotation
- Hydratation user au démarrage via `/api/auth/my-account`

### RBAC (PermissionsContext)

- `can(module, action)` — vérification granulaire
- `isAdmin` — bypass toutes les vérifications
- `accessibleModules` — liste des modules accessibles

**Modules RBAC** : `nc`, `rc`, `process`, `pa`, `diagnostic`, `admin`
**Actions** : `voir`, `creer`, `modifier`, `supprimer`, `valider`, `voirTout`, `exporter`, `gererParams`, `voirTableauDeBord`, `gererUtilisateurs`, `gererProfils`

### Profils système (seedés)

1. **Admin** — accès total (`isAdmin: true`)
2. **Responsable Qualité** — CRUD NC / Process / PA + paramètres
3. **Pilote Processus** — traite les NC de ses processus
4. **Déclarant** — déclare des NC, consulte ses fiches
5. **Consultant** — consultation & export

---

## Commandes Essentielles

```bash
# Backend
cd backend && npm install && cp .env.example .env
npm run dev     # nodemon

# Frontend
cd frontend && npm install && cp .env.example .env
npm run dev     # http://localhost:5173
npm run build   # dist/
npm run lint
```

---

## Conventions de Code

1. Langue du code : anglais. Commentaires & UI : français.
2. Commits : `feat:`, `fix:`, `refactor:`, `docs:`.
3. Pas de `controllers/` — logique dans `routes/`.
4. Un fichier = un modèle / une route (1-to-1).
5. Routes backend : `/api/{ressource}` en kebab-case.
6. Pages frontend groupées par feature dans `src/pages/{feature}/`.
7. Composants fonctionnels uniquement, PascalCase.
8. Slices Redux : `createAsyncThunk` pour toute API.
9. Routes lazy-loaded avec `React.lazy()` + `<LoadingScreen />`.
10. Formulaires : wrappers RHF/MUI (RHFTextField, RHFSelect, RHFCheckbox, RHFAutocomplete).
11. Styling : `sx` prop MUI ou `styled()`.

---

## Theme & Design

- Couleurs par défaut : primary `#1B4B8A` (bleu), secondary `#7AB929` (vert)
- Police : Public Sans (Google Fonts)
- Mode clair par défaut, layout vertical LTR
- Couleurs sémantiques : info, success, warning, error
- Palette & logo personnalisables via `/dashboard/settings`

---

## Variables d'Environnement (frontend)

```
VITE_HOST_API_KEY=https://votre-backend.vercel.app
```

Fallback dans `config.js` vers `http://localhost:5001`.

---

## Déploiement

- Hébergé sur Vercel (backend + frontend)
- SPA rewrite dans `vercel.json`
- Build frontend : `dist/`

---

## Liens

- [CLAUDE.md Backend](./backend/CLAUDE.md)
- [CLAUDE.md Frontend](./frontend/CLAUDE.md)
