# Skill : Ajouter un Nouveau Module Métier — Faytek Starter

> Checklist end-to-end à suivre dans l'ordre strict.
> Consulter aussi : profil-permissions.md, CLAUDE.md backend, CLAUDE.md frontend.

---

## 0. Variables à définir avant de commencer

| Variable        | Exemple NC             | Description                             |
| --------------- | ---------------------- | --------------------------------------- |
| `MODULE_KEY`    | `nonConformites`       | Clé camelCase dans permissions          |
| `ENTITY_NAME`   | `NonConformite`        | PascalCase — nom du modèle Mongoose     |
| `ROUTE_PREFIX`  | `/api/non-conformite`  | kebab-case — préfixe de la route API    |
| `MODULE_LABEL`  | `Non-conformités`      | Label affiché dans l'UI                 |
| `CHAMPS`        | voir section Modèle    | Liste des champs métier                 |
| `ACTIONS_DISPO` | creer, valider, export | Actions métier au-delà du CRUD standard |

---

## Backend — 5 étapes

### B1 — Modèle Mongoose

Fichier : `backend/models/NonConformite.js`

Obligations :

- `{ timestamps: true }` — obligatoire sur tous les modèles
- `trim: true` sur tous les champs String
- Index sur les champs filtrés fréquemment (statut, gravite, date, responsable)
- Enum avec valeurs en français, `required: true` sur les champs obligatoires
- Références utilisateurs via `{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }`
- Champ `historique` (array) pour tracer les changements de statut si nécessaire

Champs du module Non-conformité :

```js
{
  reference:        String (auto-généré, unique, ex: NC-2026-001),
  titre:            String (required),
  description:      String (required),
  type:             Enum ['Processus', 'Produit', 'Service', 'Sécurité', 'Autre'] (required),
  gravite:          Enum ['Mineure', 'Majeure', 'Critique'] (required),
  statut:           Enum ['Ouverte', 'En cours', 'En attente', 'Clôturée'] (default: 'Ouverte'),
  dateDetection:    Date (required),
  dateEcheance:     Date,
  lieuDetection:    String,
  detectePar:       ObjectId ref User (required),
  responsable:      ObjectId ref User,
  actionCorrective: String,
  coutEstime:       Number (min: 0),
  clotureLe:        Date,
  clotureNote:      String,
}
```

Auto-génération de la référence :

```js
nonConformiteSchema.pre("save", async function (next) {
  if (!this.reference) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.reference = `NC-${year}-${String(count + 1).padStart(3, "0")}`;
  }
  next();
});
```

### B2 — Routes CRUD + actions métier

Fichier : `backend/routes/nonConformite.js`

Protection de chaque route :

```js
router.get(
  "/",
  verifyToken,
  verifyPermission("nonConformites", "voirListe"),
  handler,
);
router.get(
  "/export/excel",
  verifyToken,
  verifyPermission("nonConformites", "exporter"),
  handler,
);
router.get(
  "/:id",
  verifyToken,
  verifyPermission("nonConformites", "voir"),
  handler,
);
router.post(
  "/",
  verifyToken,
  verifyPermission("nonConformites", "creer"),
  handler,
);
router.put(
  "/:id",
  verifyToken,
  verifyPermission("nonConformites", "modifier"),
  handler,
);
router.put(
  "/:id/valider",
  verifyToken,
  verifyPermission("nonConformites", "valider"),
  handler,
);
router.put(
  "/:id/cloturer",
  verifyToken,
  verifyPermission("nonConformites", "valider"),
  handler,
);
router.delete(
  "/:id",
  verifyToken,
  verifyPermission("nonConformites", "supprimer"),
  handler,
);
```

Filtres sur GET / (query params) :

```js
// ?statut=Ouverte&gravite=Critique&responsable=userId&dateDebut=2026-01-01&dateFin=2026-12-31&search=titre
const query = {};
if (req.query.statut) query.statut = req.query.statut;
if (req.query.gravite) query.gravite = req.query.gravite;
if (req.query.responsable) query.responsable = req.query.responsable;
if (req.query.search) query.titre = { $regex: req.query.search, $options: "i" };
if (req.query.dateDebut || req.query.dateFin) {
  query.dateDetection = {};
  if (req.query.dateDebut)
    query.dateDetection.$gte = new Date(req.query.dateDebut);
  if (req.query.dateFin) query.dateDetection.$lte = new Date(req.query.dateFin);
}
```

Export Excel avec xlsx :

```js
const XLSX = require("xlsx");
// Récupérer toutes les NC (sans pagination)
// Mapper en tableau plat [{Reference, Titre, Type, Gravité, Statut, Responsable, Date détection, ...}]
// XLSX.utils.json_to_sheet() → workbook → writeFile ou res.send buffer
res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
);
res.setHeader(
  "Content-Disposition",
  `attachment; filename=non-conformites-${Date.now()}.xlsx`,
);
res.send(buffer);
```

Obligations :

- Validation Joi sur tous les POST/PUT
- `mongoose.Types.ObjectId.isValid(id)` avant tout findById
- populate : `detectePar responsable` (select: 'nom prenom email')
- Réponses au format standard CLAUDE.md backend

### B3 — Enregistrer dans index.js

```js
const nonConformiteRoute = require("./routes/nonConformite");
app.use("/api/non-conformite", nonConformiteRoute);
```

### B4 — Mettre à jour Profil.js + constantes

Dans `backend/constants/permissions.js` → ajouter `'nonConformites'` dans `MODULES`.
Dans `backend/models/Profil.js` → ajouter `nonConformites` dans l'objet permissions.
Dans `backend/scripts/seedProfils.js` → ajouter les permissions NC aux profils existants.

### B5 — Validation Joi complète

```js
const schema = Joi.object({
  titre: Joi.string().required(),
  description: Joi.string().required(),
  type: Joi.string()
    .valid("Processus", "Produit", "Service", "Sécurité", "Autre")
    .required(),
  gravite: Joi.string().valid("Mineure", "Majeure", "Critique").required(),
  dateDetection: Joi.date().required(),
  dateEcheance: Joi.date().optional(),
  lieuDetection: Joi.string().optional().allow(""),
  responsable: Joi.string().optional(),
  actionCorrective: Joi.string().optional().allow(""),
  coutEstime: Joi.number().min(0).optional(),
});
```

---

## Frontend — 7 étapes

### F1 — Slice Redux

Fichier : `src/redux/slices/nonConformiteSlice.js`

État : `{ list, current, loading, error, total, filters }`

Thunks :

- `fetchNonConformites(filters)` → GET /api/non-conformite?...
- `fetchNonConformiteById(id)` → GET /api/non-conformite/:id
- `createNonConformite(data)` → POST
- `updateNonConformite({ id, data })` → PUT
- `deleteNonConformite(id)` → DELETE
- `validerNonConformite(id)` → PUT /:id/valider
- `cloturerNonConformite({ id, note })` → PUT /:id/cloturer
- `exportNonConformites(filters)` → GET /export/excel (réponse blob → download auto)

Ajouter dans `rootReducer.js` : `nonConformites: nonConformiteReducer`

### F2 — Pages

```
src/pages/nonConformites/
├── NonConformiteList.jsx    ← tableau + filtres + stats rapides
├── NonConformiteForm.jsx    ← formulaire création/édition (RHF + Yup)
└── NonConformiteDetail.jsx  ← fiche détail + historique + actions
```

**NonConformiteList.jsx** doit avoir :

- Chips de stats en header : total, ouvertes, critiques, en retard
- Filtres : statut (Select), gravité (Select), responsable (Autocomplete), plage de dates, recherche texte
- Tableau MUI DataGrid ou Table avec colonnes : Référence, Titre, Type, Gravité (Label coloré), Statut (Label coloré), Responsable, Date détection, Actions
- Couleurs Label : Mineure=info, Majeure=warning, Critique=error / Ouverte=error, En cours=warning, Clôturée=success
- Bouton Export Excel (CanAccess module="nonConformites" action="exporter")
- Bouton Nouvelle NC (CanAccess module="nonConformites" action="creer")
- Pagination

**NonConformiteForm.jsx** :

- RHF + Yup
- Champs groupés : Informations générales | Détails | Assignation
- Select pour type, gravité (avec couleur)
- DatePicker MUI pour dateDetection, dateEcheance
- Autocomplete pour responsable (recherche users)
- Submit → POST création ou PUT édition selon présence d'un id

**NonConformiteDetail.jsx** :

- Fiche complète avec tous les champs
- Bouton Valider (CanAccess action="valider") → dialog confirmation
- Bouton Clôturer (CanAccess action="valider") → dialog avec champ note
- Bouton Modifier (CanAccess action="modifier") → link vers form
- Timeline/historique des changements de statut

### F3 — Slice filters dans le store

Sauvegarder les filtres actifs dans le slice pour les restaurer au retour sur la liste.
Ajouter `nonConformites` dans `whitelist` de redux-persist si restauration souhaitée.

### F4 — Paths

```js
// src/routes/paths.js
nonConformites: {
  root:   '/dashboard/non-conformites',
  list:   '/dashboard/non-conformites/list',
  new:    '/dashboard/non-conformites/new',
  edit:   (id) => `/dashboard/non-conformites/${id}/edit`,
  detail: (id) => `/dashboard/non-conformites/${id}`,
},
```

### F5 — Routes (lazy loading obligatoire)

```jsx
const NonConformiteList   = Loadable(lazy(() => import('../pages/nonConformites/NonConformiteList')));
const NonConformiteForm   = Loadable(lazy(() => import('../pages/nonConformites/NonConformiteForm')));
const NonConformiteDetail = Loadable(lazy(() => import('../pages/nonConformites/NonConformiteDetail')));

// Dans children DashboardLayout :
{ path: 'non-conformites/list',      element: <NonConformiteList /> },
{ path: 'non-conformites/new',       element: <NonConformiteForm /> },
{ path: 'non-conformites/:id/edit',  element: <NonConformiteForm /> },
{ path: 'non-conformites/:id',       element: <NonConformiteDetail /> },
```

### F6 — Navbar

Créer `src/layouts/dashboard/navbar/navConfigNC.jsx` :

```js
[
  {
    subheader: "Qualité",
    items: [
      {
        title: "Non-conformités",
        path: PATH_DASHBOARD.nonConformites.list,
        icon: <Iconify icon="mdi:alert-circle-outline" />,
      },
    ],
  },
];
```

### F7 — SelectModule.jsx

Ajouter la carte module NC avec icône `mdi:alert-circle-outline`, couleur warning.
Dispatch `setModule('nonConformites')` au clic.

---

## Checklist finale avant commit

### Backend

- [ ] Modèle avec auto-référence, timestamps, indexes
- [ ] Validation Joi complète POST/PUT
- [ ] `ObjectId.isValid()` avant chaque findById
- [ ] `verifyPermission` sur chaque route
- [ ] Filtres query params sur GET /
- [ ] Export Excel fonctionnel
- [ ] Route enregistrée dans index.js
- [ ] `nonConformites` ajouté dans MODULES + Profil.js + seed

### Frontend

- [ ] Slice Redux avec tous les thunks + export blob
- [ ] Pages avec lazy loading
- [ ] `CanAccess` sur tous les boutons d'action
- [ ] Labels colorés par gravité et statut
- [ ] Filtres persistés dans le slice
- [ ] Paths + routes + navbar + SelectModule à jour
- [ ] `nonConformites` ajouté dans MODULES frontend
