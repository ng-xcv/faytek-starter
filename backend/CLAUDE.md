# CLAUDE.md — Backend Faytek Starter

> Ce fichier est la référence absolue pour tout agent (Claude Code, FaytekDev, etc.) travaillant sur le backend.
> Lire ce fichier en entier avant de toucher au code.

---

## Stack & Versions

| Package | Version | Rôle |
|---|---|---|
| Node.js | ≥ 22.x | Runtime |
| Express | ^5.2.x | Framework HTTP |
| Mongoose | ^9.x | ODM MongoDB Atlas |
| jsonwebtoken | ^9.0.x | JWT tokens |
| bcrypt | ^6.x | Hash mots de passe |
| helmet | ^8.1.x | Headers HTTP de sécurité |
| express-rate-limit | ^7.x | Rate limiting (anti brute-force) |
| cookie-parser | ^1.4.x | Parsing cookies httpOnly |
| Joi | ^17.x | Validation entrées |
| Multer | ^2.1.x | Upload fichiers |
| dotenv | ^16.x | Variables d'environnement |
| cors | ^2.8.x | Gestion CORS (credentials: true) |
| express-session | ^1.18.x | Sessions |
| nodemailer | ^7.x | Emails |
| xlsx | ^0.18.x | Import/Export Excel |
| nodemon | ^3.x | Dev (hot-reload) |

---

## Structure des Dossiers

```
backend/
├── index.js               ← Serveur Express : CORS, middlewares, routes, connexion MongoDB
├── middleware/
│   └── verifyToken.js     ← Tous les middlewares d'auth JWT
├── models/
│   ├── User.js            ← Utilisateur (email, password, profil ref, modules, etc.)
│   ├── Profil.js          ← Profil avec permissions granulaires (objet imbriqué)
│   └── ...                ← Un fichier par entité métier
├── routes/
│   ├── auth.js            ← Login, logout, profile, my-account
│   ├── user.js            ← CRUD utilisateurs + import PAA
│   ├── profil.js          ← CRUD profils + seed
│   └── ...                ← Un fichier par ressource
├── utils/
│   └── token.js           ← Génération JWT access/refresh tokens
├── uploads/
│   ├── avatars/           ← Photos de profil
│   └── da/                ← Documents demandes d'achat
├── scripts/               ← Scripts utilitaires one-shot (seed, migration)
├── vercel.json            ← Config déploiement serverless Vercel
├── .env.example
└── package.json
```

---

## Conventions de Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichiers de routes | camelCase | `demandeAchat.js`, `diClient.js` |
| Fichiers de modèles | PascalCase | `DemandeAchat.js`, `User.js` |
| Variables | camelCase | `accessToken`, `userId` |
| Constantes | UPPER_SNAKE | `JWT_SECRET`, `PORT` |
| Routes API | kebab-case | `/api/demande-achat` |

---

## Pattern de Réponse API Standardisé

### Succès
```json
// GET liste
{ "ressources": [...] }

// GET un item
{ "user": { ... } }

// POST création
{ "message": "Créé avec succès", "ressource": { ... } }

// PUT mise à jour
{ "message": "Mis à jour avec succès", "ressource": { ... } }

// DELETE
{ "message": "Supprimé avec succès" }
```

### Erreur
```json
{ "message": "Description de l'erreur en français" }
```

**Codes HTTP utilisés :**
| Code | Cas d'usage |
|---|---|
| 200 | Succès GET/PUT |
| 201 | Succès POST (création) |
| 400 | Validation échouée / Bad request |
| 401 | Non authentifié (token manquant) |
| 403 | Autorisé mais pas de permission |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur interne |

---

## Authentification

Faytek Starter utilise **JWT en cookies httpOnly** (access 15 min + refresh 7 j) avec rotation des refresh tokens. Aucun token n'est exposé au JavaScript du navigateur → immunité contre XSS.

### Comment ça fonctionne

1. L'utilisateur envoie `POST /api/auth/login` avec `{ email, password }` (rate-limit : 10 essais / 15 min / IP)
2. Le backend vérifie le mot de passe avec **bcrypt** (`user.comparePassword`)
3. Il pose deux cookies httpOnly : `accessToken` (15 min, path `/`) et `refreshToken` (7 j, path `/api/auth`)
4. Le hash SHA-256 du refresh token est persisté en DB (`User.refreshTokenHash`) pour permettre la rotation/révocation
5. Chaque requête suivante envoie automatiquement les cookies (frontend `axios` avec `withCredentials: true`)
6. Sur 401, l'intercepteur axios appelle `POST /api/auth/refresh` puis rejoue la requête. Si le refresh échoue → redirect login.
7. `POST /api/auth/logout` efface les cookies et le hash en DB

### Protéger une route
```js
const { verifyToken, verifyPermission, verifyAdmin } = require('../middleware/verifyToken');

// Auth simple
router.get('/protected', verifyToken, (req, res) => { ... });

// Permission granulaire
router.post('/da/new', verifyPermission('da', 'creer'), (req, res) => { ... });

// Admin uniquement
router.delete('/user/:id', verifyAdmin, (req, res) => { ... });
```

### Payload du JWT décodé (disponible dans `req.user`)
```json
{
  "_id": "userId",
  "profil": "Admin"
}
```

---

## Validation des Données (Joi)

Toujours valider les entrées avec Joi dans les routes :

```js
const Joi = require('joi');

const schema = Joi.object({
  nom: Joi.string().required(),
  email: Joi.string().email().required(),
  montant: Joi.number().positive().required(),
});

router.post('/', verifyToken, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  // ... logique
});
```

---

## Variables d'Environnement

> ⚠️ **Les variables marquées OBLIGATOIRE font crasher le serveur si absentes.** Pas de fallback hardcodé.

| Variable | Obligatoire | Description |
|---|---|---|
| `PORT` | non | Port d'écoute local (défaut 5000) |
| `NODE_ENV` | non | `development` / `production` |
| `MONGO_URI` | **oui** | URI de connexion MongoDB Atlas |
| `JWT_SECRET` | **oui** | Clé access token (15 min) — `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | **oui** | Clé refresh token (7 j) — DOIT être différente de `JWT_SECRET` |
| `SESSION_SECRET` | **oui** | Clé express-session |
| `JWT_CLIENT_SECRET` | non | Clé JWT portail clients DI (si module DI) |
| `SMTP_USER` | non | Email d'envoi (SMTP Gmail) |
| `SMTP_PASSWORD` | non | Mot de passe d'application Gmail |
| `FRONTEND_URL` | non | URL du frontend (ajoutée à la whitelist CORS) |
| `CLIENT_URL` | non | URL alternative frontend |

---

## Comment Créer un Nouveau Module (étapes)

### 1. Créer le modèle
```
backend/models/MonEntite.js
```

```js
const mongoose = require('mongoose');

const monEntiteSchema = new mongoose.Schema({
  libelle: { type: String, required: true, trim: true },
  description: { type: String },
  actif: { type: Boolean, default: true },
  // ... autres champs
}, { timestamps: true });

module.exports = mongoose.model('MonEntite', monEntiteSchema);
```

### 2. Créer la route
```
backend/routes/monEntite.js
```

```js
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const MonEntite = require('../models/MonEntite');
const { verifyToken } = require('../middleware/verifyToken');

const schema = Joi.object({ libelle: Joi.string().required() });

// GET all
router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await MonEntite.find().sort({ createdAt: -1 });
    res.json({ monEntites: items });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST
router.post('/', verifyToken, async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  try {
    const item = await MonEntite.create(req.body);
    res.status(201).json({ message: 'Créé avec succès', monEntite: item });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const item = await MonEntite.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Introuvable' });
    res.json({ message: 'Mis à jour', monEntite: item });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await MonEntite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé avec succès' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
```

### 3. Enregistrer dans index.js
```js
const monEntiteRoute = require('./routes/monEntite');
// ...
app.use('/api/mon-entite', monEntiteRoute);
```

---

## Commandes Disponibles

```bash
npm run dev      # Développement avec nodemon (hot-reload)
npm start        # Production (node index.js)
```

---

## Points d'Attention pour Claude Code ⚠️

1. **Pas de dossier `controllers/`** — la logique est dans `routes/` directement
2. **Connexion MongoDB lazy** pour Vercel serverless — ne jamais appeler `mongoose.connect()` en dehors du middleware ou du bloc local
3. **Auth = cookies httpOnly** (pas `localStorage`). Le middleware `verifyToken` lit `req.cookies.accessToken` en priorité, avec fallback header `token`/`Authorization` pour rétrocompatibilité (clients non-navigateur uniquement)
4. **Hash mot de passe = bcrypt (cost 12)** via le hook `pre('save')` du modèle `User`. Le champ `password` est `select: false` → utiliser `.select('+password')` quand nécessaire
5. **`select: false` aussi sur `refreshTokenHash`** — toujours l'exclure des réponses API
6. **Multer** est configuré par route, pas globalement
7. **Joi** est obligatoire pour toute route POST/PUT — ne jamais accéder à `req.body` sans validation
8. **`mongoose.Types.ObjectId.isValid()`** obligatoire avant tout `findById(req.params.id)` — utiliser le middleware `validateObjectId` du pattern
9. **`verifyAdmin` obligatoire** sur les routes POST/PUT/DELETE qui touchent à des données sensibles (users, profils, etc.)
10. **Variables d'environnement OBLIGATOIRES** : le serveur crash au boot si `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`, `MONGO_URI` sont absentes. **Aucun fallback hardcodé**.
11. **`/uploads` est protégé par `verifyToken`** — un fichier uploadé n'est jamais public
12. **En production, l'error handler masque le `err.message`** (5xx → message générique) — ne pas inverser ce comportement
13. **Le rate-limit sur `/api/auth/login`** est de 10 essais / 15 min / IP — adapter `loginLimiter` dans `routes/auth.js` si besoin
14. **`vercel.json`** doit exister pour le déploiement serverless — ne pas supprimer
15. **`module.exports = app`** en bas de `index.js` — requis pour Vercel
16. **Les timestamps** (`createdAt`, `updatedAt`) sont activés sur tous les modèles via `{ timestamps: true }`
17. **`populate('profil')`** est systématique sur les queries User qui ont besoin des permissions
