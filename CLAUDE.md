# CLAUDE.md — Faytek Starter (Vision Globale)

> Starter officiel FaytekDev basé sur l'architecture BuyFlow (Faytek Solution).
> Ce dossier est le point d'entrée pour tout agent ou développeur travaillant sur ce projet.

---

## Objectif

Ce starter est le **template de référence Faytek Solution** pour tout nouveau projet full-stack.
Il reproduit fidèlement les patterns, conventions et structure de BuyFlow, mis à jour vers les dernières versions stables (2025-2026).

---

## Stack Technique Complète

### Backend

| Technologie        | Version | Rôle                             |
| ------------------ | ------- | -------------------------------- |
| Node.js            | ≥ 22.x  | Runtime                          |
| Express            | ^5.2.x  | Framework HTTP                   |
| Mongoose           | ^9.x    | ODM MongoDB                      |
| jsonwebtoken       | ^9.0.x  | Auth JWT                         |
| bcrypt             | ^6.x    | Hash mots de passe               |
| helmet             | ^8.1.x  | Headers HTTP de sécurité         |
| express-rate-limit | ^7.x    | Rate limiting (anti brute-force) |
| cookie-parser      | ^1.4.x  | Cookies httpOnly                 |
| Joi                | ^17.x   | Validation des données           |
| Multer             | ^2.1.x  | Upload fichiers                  |
| dotenv             | ^16.x   | Variables d'environnement        |
| cors               | ^2.8.x  | CORS (credentials: true)         |
| express-session    | ^1.18.x | Sessions                         |
| nodemailer         | ^7.x    | Envoi d'emails                   |
| xlsx               | ^0.18.x | Import/Export Excel              |
| nodemon            | ^3.x    | Dev hot-reload                   |

### Frontend

| Technologie             | Version  | Rôle                           |
| ----------------------- | -------- | ------------------------------ |
| Vite                    | ^8.x     | Bundler                        |
| @vitejs/plugin-react    | ^5.x     | Plugin React                   |
| React                   | ^19.2.x  | UI Framework                   |
| React Router DOM        | ^7.14.x  | Routing                        |
| MUI (Material UI)       | ^9.x     | UI Library                     |
| @emotion/react + styled | ^11.14.x | CSS-in-JS                      |
| Redux Toolkit           | ^2.11.x  | État global                    |
| redux-persist           | ^6.x     | Persistance Redux              |
| react-hook-form         | ^7.x     | Formulaires                    |
| @hookform/resolvers     | ^3.x     | Résolveurs (Yup)               |
| Yup                     | ^1.x     | Validation formulaires         |
| Axios                   | ^1.x     | HTTP client (cookies httpOnly) |
| @iconify/react          | ^5.x     | Icônes                         |
| notistack               | ^3.x     | Notifications snackbar         |
| date-fns                | ^4.x     | Manipulation dates             |
| simplebar-react         | ^3.x     | Scrollbar custom               |
| ESLint                  | ^9.x     | Linter (flat config)           |

---

## Architecture Globale

```
faytek-starter/
├── backend/                    ← API Express / MongoDB
│   ├── index.js                ← Point d'entrée, config CORS, connexion MongoDB
│   ├── middleware/
│   │   └── verifyToken.js      ← JWT auth + permissions granulaires
│   ├── models/                 ← Schémas Mongoose
│   ├── routes/                 ← Toute la logique métier (pas de controllers)
│   ├── utils/
│   │   └── token.js            ← Génération tokens JWT
│   ├── uploads/                ← Fichiers uploadés (avatars, documents)
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── CLAUDE.md
│
├── frontend/                   ← App React / Vite
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx            ← Entrée React
│   │   ├── App.jsx             ← Providers (Redux, Theme, Auth, Router)
│   │   ├── config.js           ← Constantes globales (HOST_API, NAVBAR, etc.)
│   │   ├── assets/             ← Images, SVG, logo
│   │   ├── components/         ← Composants partagés
│   │   │   └── hook-form/      ← Wrappers RHF (RHFTextField, RHFSelect, etc.)
│   │   ├── contexts/           ← AuthContext, PermissionsContext
│   │   ├── guards/             ← AuthGuard, GuestGuard, ModuleGuard
│   │   ├── hooks/              ← useAuth, useResponsive
│   │   ├── layouts/            ← DashboardLayout, navbar, header
│   │   ├── pages/              ← Pages par feature (auth/, dashboard/, users/, etc.)
│   │   ├── redux/              ← Store + slices RTK
│   │   ├── routes/             ← Router React avec lazy loading
│   │   ├── theme/              ← Palette MUI, typography, shadows
│   │   └── utils/              ← axios.js, jwt.js, formatNumber.js
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── CLAUDE.md
│
├── .gitignore
└── README.md
```

---

## Commandes Essentielles

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Remplir les variables
npm run dev            # Développement (nodemon)
npm start              # Production
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Remplir les variables
npm run dev            # Développement (Vite)
npm run build          # Build production
npm run preview        # Prévisualiser le build
npm run lint           # Vérification ESLint
```

---

## Conventions Générales

1. **Langue du code** : anglais (noms de variables, fonctions, fichiers)
2. **Langue des commentaires/messages** : français
3. **Style de commit** : `feat:`, `fix:`, `refactor:`, `docs:`
4. **Pas de `controllers/`** : la logique métier est directement dans `routes/`
5. **Un fichier = un modèle / une route** (convention 1-to-1)
6. **Les routes backend** suivent `/api/{ressource}`
7. **Les pages frontend** sont organisées par feature dans `src/pages/{feature}/`

---

## Liens

- [CLAUDE.md Backend](./backend/CLAUDE.md)
- [CLAUDE.md Frontend](./frontend/CLAUDE.md)
