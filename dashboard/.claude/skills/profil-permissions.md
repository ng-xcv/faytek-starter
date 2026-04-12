    # Skill : Profil & Permissions Dynamiques — Faytek Starter

> Lire ce fichier AVANT toute modification du modèle Profil, du middleware
> verifyPermission, ou des composants CanAccess / usePermissions.

---

## Architecture globale

Chaque Profil contient un objet `permissions` imbriqué : un sous-objet par module,
avec une clé booléenne par action. `isAdmin: true` court-circuite tout.

```
Profil {
  nom: "Gestionnaire",
  isAdmin: false,
  permissions: {
    users:          { voirListe, voir, creer, modifier, supprimer },
    profils:        { voirListe, voir, creer, modifier, supprimer },
    nonConformites: { voirListe, voir, creer, modifier, supprimer, valider, exporter },
    // + un sous-objet par module métier ajouté ultérieurement
  }
}
```

---

## Constantes de référence

```js
// backend/constants/permissions.js
const MODULES = ["users", "profils", "nonConformites"];
const ACTIONS = [
  "voirListe",
  "voir",
  "creer",
  "modifier",
  "supprimer",
  "valider",
  "exporter",
];
module.exports = { MODULES, ACTIONS };
```

> ⚠️ À chaque nouveau module métier :
>
> 1. Ajouter sa clé dans `MODULES`
> 2. Ajouter le sous-objet correspondant dans `Profil.js`
> 3. Mettre à jour le seed

Ne jamais hardcoder un module ou une action ailleurs — toujours importer ces constantes.

---

## Backend — Modèle Profil.js

```js
const mongoose = require("mongoose");
const { MODULES, ACTIONS } = require("../constants/permissions");

// Sous-schéma réutilisable pour les permissions d'un module
const modulePermSchema = new mongoose.Schema(
  ACTIONS.reduce(
    (acc, action) => ({ ...acc, [action]: { type: Boolean, default: false } }),
    {},
  ),
  { _id: false },
);

// Objet permissions : une entrée par module
const permissionsShape = MODULES.reduce(
  (acc, mod) => ({
    ...acc,
    [mod]: { type: modulePermSchema, default: () => ({}) },
  }),
  {},
);

const profilSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    isAdmin: { type: Boolean, default: false },
    actif: { type: Boolean, default: true },
    permissions: {
      type: new mongoose.Schema(permissionsShape, { _id: false }),
      default: () => ({}),
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Profil", profilSchema);
```

---

## Backend — middleware/verifyToken.js

### verifyToken — populer le profil obligatoirement

```js
const verifyToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers["token"] ||
      req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id)
      .populate("profil")
      .select("-password -refreshTokenHash");
    if (!user)
      return res.status(401).json({ message: "Utilisateur introuvable" });

    req.user = user; // user.profil = document Profil complet
    next();
  } catch {
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};
```

### verifyPermission — middleware factory

```js
const verifyPermission = (module, action) => (req, res, next) => {
  const profil = req.user?.profil;
  if (!profil) return res.status(403).json({ message: "Profil introuvable" });
  if (profil.isAdmin) return next();
  if (!profil.permissions?.[module]?.[action]) {
    return res
      .status(403)
      .json({ message: `Permission refusée : ${module}.${action}` });
  }
  next();
};
```

### verifyAdmin

```js
const verifyAdmin = (req, res, next) => {
  if (!req.user?.profil?.isAdmin) {
    return res.status(403).json({ message: "Accès administrateur requis" });
  }
  next();
};
```

---

## Backend — Gardes obligatoires sur DELETE Profil

```js
// 1. Profil Admin non supprimable
if (profil.isAdmin)
  return res
    .status(400)
    .json({ message: "Le profil Administrateur ne peut pas être supprimé" });

// 2. Profil utilisé par des users
const count = await User.countDocuments({ profil: req.params.id });
if (count > 0)
  return res
    .status(400)
    .json({
      message: `Impossible : ${count} utilisateur(s) rattaché(s) à ce profil`,
    });
```

---

## Backend — Seed par défaut (scripts/seedProfils.js)

```js
const profils = [
  {
    nom: "Administrateur",
    description: "Accès complet à toutes les fonctionnalités",
    isAdmin: true,
  },
  {
    nom: "Gestionnaire",
    description: "Gestion opérationnelle — création, modification, validation",
    isAdmin: false,
    permissions: {
      users: { voirListe: true, voir: true },
      profils: { voirListe: true, voir: true },
      nonConformites: {
        voirListe: true,
        voir: true,
        creer: true,
        modifier: true,
        valider: true,
        exporter: true,
      },
    },
  },
  {
    nom: "Consultant",
    description: "Lecture seule sur tous les modules",
    isAdmin: false,
    permissions: {
      users: { voirListe: true, voir: true },
      nonConformites: { voirListe: true, voir: true, exporter: true },
    },
  },
];
```

---

## Frontend — PermissionsContext.jsx

```jsx
import { createContext, useContext, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const { user } = useAuth();

  const value = useMemo(() => {
    const profil = user?.profil;
    const isAdmin = profil?.isAdmin ?? false;

    // can('nonConformites', 'creer') → true/false
    const can = (module, action) => {
      if (isAdmin) return true;
      return profil?.permissions?.[module]?.[action] ?? false;
    };

    // canAny('nonConformites', ['modifier', 'valider']) → true si au moins une
    const canAny = (module, actions = []) =>
      actions.some((a) => can(module, a));

    return { can, canAny, isAdmin, profil };
  }, [user]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx)
    throw new Error(
      "usePermissions doit être utilisé dans PermissionsProvider",
    );
  return ctx;
};
```

---

## Frontend — CanAccess.jsx

```jsx
import { usePermissions } from "../contexts/PermissionsContext";

/**
 * Affiche children uniquement si la permission est accordée.
 * Si module ou action est absent → toujours affiché (pas de restriction).
 *
 * @example
 * <CanAccess module="nonConformites" action="creer">
 *   <Button>Nouvelle NC</Button>
 * </CanAccess>
 *
 * <CanAccess module="nonConformites" action="supprimer" fallback={<Chip label="Non autorisé" />}>
 *   <IconButton onClick={handleDelete}><DeleteIcon /></IconButton>
 * </CanAccess>
 */
export default function CanAccess({
  module,
  action,
  children,
  fallback = null,
}) {
  const { can } = usePermissions();
  if (!module || !action) return children;
  return can(module, action) ? children : fallback;
}
```

---

## Frontend — buildDefaultValues pour ProfilForm

```js
import { MODULES, ACTIONS } from "../constants/permissions";

export const buildDefaultValues = (profil = null) => ({
  nom: profil?.nom || "",
  description: profil?.description || "",
  isAdmin: profil?.isAdmin || false,
  actif: profil?.actif ?? true,
  permissions: MODULES.reduce(
    (acc, mod) => ({
      ...acc,
      [mod]: ACTIONS.reduce(
        (a, action) => ({
          ...a,
          [action]: profil?.permissions?.[mod]?.[action] ?? false,
        }),
        {},
      ),
    }),
    {},
  ),
});
```

---

## Règles critiques

1. **Ne jamais hardcoder** modules ou actions — importer les constantes
2. **isAdmin bypasse tout** — vérifier en premier, backend ET frontend
3. **populate('profil')** systématique sur toutes les queries User qui ont besoin des permissions
4. **Profil Admin = non supprimable** — garde obligatoire backend
5. **DELETE profil** → vérifier `User.countDocuments({ profil: id })` avant
6. **Permission manquante = false** — ne jamais throw pour une clé absente
7. **Ajouter le module dans `MODULES`** et dans `Profil.js` à chaque nouveau module métier
8. **Mettre à jour le seed** à chaque nouveau module
9. **Ordre Providers App.jsx** : Redux → PersistGate → BrowserRouter → Theme → Auth → **Permissions** → Snackbar → Router
