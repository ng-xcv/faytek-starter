# CLAUDE.md — Backend Faytek Starter

> Ce fichier est la référence absolue pour tout agent (Claude Code, FaytekDev, etc.) travaillant sur le backend.
> Lire ce fichier en entier avant de toucher au code.

---

## Stack & Versions

| Package | Version | Rôle |
|---|---|---|
| Node.js | ≥ 22.x | Runtime |
| Express | ^4.21.x | Framework HTTP |
| Mongoose | ^8.x | ODM MongoDB Atlas |
| jsonwebtoken | ^9.0.x | JWT tokens |
| Joi | ^17.x | Validation entrées |
| Multer | ^1.4.x | Upload fichiers |
| dotenv | ^16.x | Variables d'environnement |
| cors | ^2.8.x | Gestion CORS |
| express-session | ^1.17.x | Sessions |
| nodemailer | ^6.x | Emails |
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

BuyFlow utilise **JWT stocké côté client dans localStorage** (pas de httpOnly cookie).

### Comment ça fonctionne
1. L'utilisateur envoie `POST /api/auth/login` avec `{ email, password }`
2. Le backend vérifie le mot de passe (hashé avec `crypto-js`)
3. Il retourne `{ accessToken, user }` 
4. Le frontend stocke l'`accessToken` dans `localStorage`
5. Chaque requête suivante envoie le token dans le header `token: Bearer <jwt>`

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

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port d'écoute local | `5000` |
| `URI` | URI MongoDB Atlas | `mongodb+srv://...` |
| `JWT_SECRET` | Clé secrète JWT utilisateurs | `secret-fort-2026!` |
| `JWT_CLIENT_SECRET` | Clé JWT portail clients DI | `client-secret-2026!` |
| `PASSWORD_SECRET` | Clé hash mots de passe (crypto-js) | `pass-secret-2026!` |
| `SESSION_SECRET` | Clé express-session | `session-secret-2026!` |
| `SMTP_USER` | Email d'envoi (SMTP Gmail) | `app@example.com` |
| `SMTP_PASSWORD` | Mot de passe app Gmail | `xxxx xxxx xxxx xxxx` |
| `FRONTEND_URL` | URL du frontend (CORS) | `https://app.example.com` |
| `CLIENT_URL` | URL alternative frontend | `https://www.app.example.com` |

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
3. **Header `token`** (pas `Authorization`) pour le JWT côté frontend — le middleware accepte les deux mais le frontend envoie `token: Bearer <jwt>`
4. **Hash mot de passe** = `crypto-js` (pas bcrypt) — ne pas changer sans migration des données
5. **Multer** est configuré par route, pas globalement
6. **Joi** est obligatoire pour toute route POST/PUT — ne jamais accéder à `req.body` sans validation
7. **`vercel.json`** doit exister pour le déploiement serverless — ne pas supprimer
8. **`module.exports = app`** en bas de `index.js` — requis pour Vercel
9. **Les timestamps** (`createdAt`, `updatedAt`) sont activés sur tous les modèles via `{ timestamps: true }`
10. **`populate('profil')`** est systématique sur les queries User qui ont besoin des permissions
