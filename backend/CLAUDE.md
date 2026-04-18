# CLAUDE.md — Backend Faytek Starter

> Référence pour tout agent (Claude Code, FaytekDev, etc.) travaillant sur le backend.
> Lire en entier avant de toucher au code.

---

## Stack & Versions

| Package            | Version | Rôle                             |
| ------------------ | ------- | -------------------------------- |
| Node.js            | ≥ 18.x  | Runtime                          |
| Express            | ^4.x    | Framework HTTP                   |
| Mongoose           | ^8.x    | ODM MongoDB Atlas                |
| jsonwebtoken       | ^9.x    | JWT tokens                       |
| bcrypt             | ^5.x    | Hash mots de passe               |
| helmet             | ^7.x    | Headers HTTP de sécurité         |
| express-rate-limit | ^7.x    | Rate limiting                    |
| cookie-parser      | ^1.4.x  | Parsing cookies httpOnly         |
| Joi                | ^17.x   | Validation entrées               |
| Multer             | ^1.x    | Upload fichiers                  |
| dotenv             | ^16.x   | Variables d'environnement        |
| cors               | ^2.8.x  | CORS (credentials: true)         |
| express-session    | ^1.x    | Sessions                         |
| nodemailer         | ^6.x    | Emails                           |
| xlsx / exceljs     | ^0.18.x | Import/Export Excel              |
| nodemon            | ^3.x    | Dev (hot-reload)                 |

---

## Modules métier

| Module    | Route montée       | Rôle                                         |
| --------- | ------------------ | -------------------------------------------- |
| auth      | `/api/auth`        | Login, logout, refresh, my-account           |
| user      | `/api/user`        | CRUD utilisateurs                            |
| profil    | `/api/profil`      | CRUD profils (permissions granulaires)       |
| nc        | `/api/non-conformite` | Non-conformités (workflow 5 étapes)       |
| process   | `/api/process`     | Référentiel Processus (CRUD)                 |
| pa        | `/api/pa`          | Plans d'actions (instances + actions)        |
| settings  | `/api/settings`    | Paramétrage général (logo, couleurs, infos)  |

---

## Structure des Dossiers

```
backend/
├── index.js               ← Serveur Express
├── middleware/
│   └── verifyToken.js     ← Auth JWT + verifyPermission / verifyAdmin
├── models/
│   ├── User.js
│   ├── Profil.js          ← Permissions granulaires imbriquées
│   ├── NonConformite.js
│   ├── Process.js
│   ├── Instance.js        ← PA : container d'actions
│   ├── Action.js          ← PA : action unitaire
│   └── Settings.js
├── routes/
│   ├── auth.js
│   ├── user.js
│   ├── profil.js
│   ├── nonConformite.js
│   ├── process.js
│   ├── pa.js
│   └── settings.js
├── constants/
│   └── permissions.js     ← MODULES & ACTIONS (source de vérité RBAC)
├── utils/
│   ├── token.js           ← Génération JWT
│   └── cloudinary.js      ← Upload médias (settings)
├── scripts/
│   ├── seedAdmin.js
│   ├── seedProfils.js
│   └── seedSettings.js
├── uploads/
│   ├── avatars/
│   └── non-conformites/
├── vercel.json
├── .env.example
└── package.json
```

---

## Permissions (RBAC)

`constants/permissions.js` définit la source de vérité :

```js
MODULES = ['nc', 'process', 'pa', 'admin'];
ACTIONS = [
  'voir', 'creer', 'modifier', 'supprimer', 'valider',
  'voirTout', 'exporter', 'gererParams', 'voirTableauDeBord',
  'gererUtilisateurs', 'gererProfils',
];
```

Le modèle `Profil` construit dynamiquement un schéma `permissions.{module}.{action} = Boolean`.

### Utilisation dans les routes

```js
const { verifyToken, verifyPermission, verifyAdmin } = require('../middleware/verifyToken');

router.get('/',        verifyToken, verifyPermission('nc', 'voir'),  ...);
router.post('/',       verifyToken, verifyPermission('nc', 'creer'), ...);
router.delete('/:id',  verifyToken, verifyAdmin,                      ...);
```

Si `profil.isAdmin === true`, toutes les vérifications passent.

### Profils système seedés (`scripts/seedProfils.js`)

1. **Admin** — Accès total (isAdmin: true)
2. **Responsable Qualité** — CRUD complet NC / Process / PA + gererParams
3. **Pilote Processus** — Traitement des NC affectées à ses processus
4. **Déclarant** — Déclare des NC, consulte ses fiches
5. **Consultant** — Consultation & export uniquement

---

## Authentification

JWT en cookies httpOnly (access 15 min + refresh 7 j) avec rotation.

1. `POST /api/auth/login { email, password }` — rate-limit 10/15 min/IP
2. bcrypt vérifie le mot de passe (cost 12)
3. Pose `accessToken` et `refreshToken` httpOnly + stocke `refreshTokenHash` en DB
4. `verifyToken` lit le cookie `accessToken` (fallback header `token` / `Authorization`)
5. Sur 401, axios frontend appelle `POST /api/auth/refresh` puis rejoue
6. `POST /api/auth/logout` efface cookies + hash

---

## Pattern de Réponse API

Succès (liste) : `{ "users": [...] }` ou `{ "data": [...] }` selon la route.
Création : `{ "message": "Créé avec succès", "<entity>": { ... } }`
Erreur : `{ "message": "Description FR" }`

Codes HTTP : 200, 201, 400, 401, 403, 404, 500.

---

## Validation (Joi)

Obligatoire pour toute route POST/PUT. Ne jamais accéder à `req.body` sans valider.

```js
const schema = Joi.object({ libelle: Joi.string().required() });
const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ message: error.details[0].message });
```

`mongoose.Types.ObjectId.isValid(req.params.id)` obligatoire avant `findById()` via le middleware `validateObjectId`.

---

## Variables d'Environnement

> Les variables **OBLIGATOIRES** font crasher le serveur au boot (fail-fast, pas de fallback).

| Variable             | Obligatoire | Description                                             |
| -------------------- | ----------- | ------------------------------------------------------- |
| `PORT`               | non         | Port local (défaut 5001)                                |
| `NODE_ENV`           | non         | `development` / `production`                            |
| `MONGO_URI`          | **oui**     | MongoDB Atlas                                           |
| `JWT_SECRET`         | **oui**     | Clé access token (15 min)                               |
| `JWT_REFRESH_SECRET` | **oui**     | Clé refresh token (7 j), ≠ JWT_SECRET                   |
| `SESSION_SECRET`     | **oui**     | Clé express-session                                     |
| `SMTP_USER` / `SMTP_PASSWORD` | non | Emails via Gmail app password                        |
| `CLOUDINARY_*`       | non         | Uploads médias (logo, favicon)                          |
| `FRONTEND_URL` / `CLIENT_URL` | non | Origines autorisées CORS                            |
| `NC_SLA_*_HOURS`     | non         | SLA personnalisables (dispatch / traitement / clôture)  |

---

## Points d'Attention

1. **Pas de dossier `controllers/`** — logique dans `routes/` directement
2. **Connexion MongoDB lazy** pour Vercel serverless
3. **Auth = cookies httpOnly** (pas `localStorage`)
4. **bcrypt cost 12** via hook `pre('save')` du modèle User ; `password` est `select: false`
5. **`refreshTokenHash` select: false** — ne jamais l'exposer
6. **Joi obligatoire** pour POST/PUT
7. **`validateObjectId`** avant tout `findById`
8. **`verifyAdmin` ou `verifyPermission`** sur les routes sensibles
9. **`/uploads` protégé par `verifyToken`**
10. **Error handler masque le message en prod** (5xx → générique)
11. **`module.exports = app`** requis pour Vercel

---

## Commandes

```bash
npm run dev      # nodemon
npm start        # production
node scripts/seedProfils.js   # profils système
node scripts/seedAdmin.js     # compte admin initial
```
