# CLAUDE.md — Frontend Faytek Starter

> Ce fichier est la référence absolue pour tout agent (Claude Code, FaytekDev, etc.) travaillant sur le frontend.
> Lire ce fichier en entier avant de toucher au code.

---

## Stack & Versions

| Package | Version | Rôle |
|---|---|---|
| Vite | ^6.x | Bundler / Dev server |
| React | ^19.x | UI Framework |
| React Router DOM | ^7.x | Routing SPA |
| MUI Material | ^6.x | UI Components |
| MUI Icons | ^6.x | Icônes MUI |
| @emotion/react + styled | ^11.x | CSS-in-JS (requis MUI) |
| Redux Toolkit | ^2.x | État global |
| redux-persist | ^6.x | Persistance Redux (localStorage) |
| react-hook-form | ^7.x | Formulaires |
| @hookform/resolvers + Yup | ^3.x / ^1.x | Validation formulaires |
| Axios | ^1.x | HTTP client |
| @iconify/react | ^5.x | Icônes multi-libraries |
| framer-motion | ^11.x | Animations |
| notistack | ^3.x | Snackbar notifications |
| jwt-decode | ^4.x | Décodage JWT côté client |
| date-fns | ^4.x | Manipulation dates |
| recharts | ^3.x | Graphiques |
| simplebar-react | ^3.x | Scrollbar custom |
| xlsx | ^0.18.x | Import/Export Excel |

---

## Structure des Dossiers

```
frontend/src/
├── main.jsx                    ← Point d'entrée React (ReactDOM.createRoot)
├── App.jsx                     ← Providers : Redux → PersistGate → BrowserRouter → Theme → Auth → Permissions → Snackbar → Router
├── config.js                   ← HOST_API, NAVBAR dimensions, HEADER heights, ICON sizes
│
├── assets/                     ← Images, logo (PNG, SVG)
│
├── components/
│   ├── CanAccess.jsx           ← Composant conditionnel selon permissions : <CanAccess module="da" action="creer">
│   ├── Iconify.jsx             ← Wrapper @iconify/react : <Iconify icon="mdi:home" />
│   ├── Label.jsx               ← Badge coloré MUI : <Label color="success">Validé</Label>
│   ├── LoadingScreen.jsx       ← Écran de chargement global
│   ├── Scrollbar.jsx           ← Scrollbar custom (simplebar-react)
│   ├── SignatureDialog.jsx     ← Dialog signature électronique (react-signature-canvas)
│   └── hook-form/
│       ├── FormProvider.jsx    ← Wrapper RHF <FormProvider methods={methods}>
│       ├── RHFTextField.jsx    ← Input texte RHF
│       ├── RHFSelect.jsx       ← Select RHF
│       ├── RHFAutocomplete.jsx ← Autocomplete MUI + RHF
│       ├── RHFCheckbox.jsx     ← Checkbox RHF
│       └── index.js            ← Re-export de tous les composants hook-form
│
├── contexts/
│   ├── AuthContext.jsx         ← Auth JWT : login/logout/updateProfile + état user
│   └── PermissionsContext.jsx  ← Calcul permissions depuis profil user + hook usePermissions()
│
├── guards/
│   ├── AuthGuard.jsx           ← Redirige vers /auth/login si non authentifié
│   ├── GuestGuard.jsx          ← Redirige vers /dashboard si déjà authentifié
│   └── ModuleGuard.jsx         ← Redirige vers /select-module si aucun module sélectionné
│
├── hooks/
│   ├── useAuth.js              ← Hook : const { user, login, logout } = useAuth()
│   └── useResponsive.js        ← Hook : détecte breakpoints MUI (mobile/tablet/desktop)
│
├── layouts/
│   └── dashboard/
│       ├── index.jsx           ← DashboardLayout (Header + NavbarVertical + Outlet)
│       ├── header/
│       │   └── DashboardHeader.jsx  ← Header avec avatar, module badge, notifications
│       └── navbar/
│           ├── NavbarVertical.jsx   ← Sidebar responsive (collapse sur mobile)
│           ├── NavSection.jsx       ← Groupe de liens nav avec titre
│           ├── NavItem.jsx          ← Item de nav avec icône + permissions
│           ├── NavConfig.jsx        ← Config nav partagée (utilitaires)
│           ├── navConfigDA.jsx      ← Nav du module Demandes d'Achat
│           └── navConfigMission.jsx ← Nav du module Missions
│
├── pages/
│   ├── auth/
│   │   └── Login.jsx           ← Page de connexion
│   ├── dashboard/
│   │   └── DashboardHome.jsx   ← Tableau de bord (stats + tableau dernières entrées)
│   ├── SelectModule.jsx        ← Sélection du module actif (DA, Mission, DI, PA)
│   ├── Page404.jsx             ← Page 404
│   └── users/                  ← Exemple : CRUD utilisateurs
│       └── UserList.jsx
│
├── redux/
│   ├── store.js                ← Store RTK + redux-persist
│   ├── rootReducer.js          ← combineReducers de tous les slices
│   └── slices/
│       ├── moduleSlice.js      ← Slice du module actif (da/mission/di/pa)
│       └── userSlice.js        ← Exemple slice CRUD users
│
├── routes/
│   ├── index.jsx               ← useRoutes() avec lazy loading + guards
│   └── paths.js                ← Constantes de chemins (PATH_DASHBOARD, PATH_AUTH)
│
├── theme/
│   ├── index.jsx               ← ThemeProvider MUI : applique palette + typographie + shadows
│   ├── palette.js              ← Couleurs brand (PRIMARY=#1B4B8A, SECONDARY=#7AB929)
│   ├── typography.js           ← Typographie MUI
│   └── shadows.js              ← Shadows MUI
│
└── utils/
    ├── axios.js                ← Instance Axios avec interceptor token + gestion 401
    ├── jwt.js                  ← isValidToken(), setSession() (stockage localStorage)
    └── formatNumber.js         ← Formatage nombres (FCFA, pourcentages, etc.)
```

---

## Conventions de Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants | PascalCase | `UserList.jsx`, `DashboardHeader.jsx` |
| Hooks | camelCase avec `use` | `useAuth.js`, `useResponsive.js` |
| Slices Redux | camelCase + `Slice` | `userSlice.js`, `moduleSlice.js` |
| Pages | PascalCase | `Login.jsx`, `DashboardHome.jsx` |
| Utils | camelCase | `axios.js`, `formatNumber.js` |
| Dossiers | camelCase | `hook-form/`, `dashboard/` |

---

## Gestion de l'État (Redux RTK)

### Pattern d'un slice
```js
// src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axios';

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const { data } = await axiosInstance.get('/api/user');
  return data.users;
});

const userSlice = createSlice({
  name: 'users',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default userSlice.reducer;
```

### Ajouter au store
```js
// src/redux/rootReducer.js
import usersReducer from './slices/userSlice';

const rootReducer = combineReducers({
  // ...existants
  users: usersReducer,
});
```

---

## Appels API

### Pattern standard dans un composant
```jsx
import axiosInstance from '../../utils/axios';
import { useSnackbar } from 'notistack';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/ma-ressource');
      setData(data.ressources);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Erreur réseau', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
}
```

**Important :** `axiosInstance` injecte automatiquement le header `token: Bearer <jwt>` et redirige vers `/auth/login` sur 401.

---

## Gestion des Formulaires (React Hook Form)

### Pattern standard
```jsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { FormProvider, RHFTextField, RHFSelect } from '../../components/hook-form';

const schema = Yup.object({
  nom: Yup.string().required('Nom requis'),
  montant: Yup.number().positive('Doit être positif').required(),
});

function MonForm({ onSuccess }) {
  const methods = useForm({ resolver: yupResolver(schema) });
  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (values) => {
    await axiosInstance.post('/api/ma-ressource', values);
    onSuccess();
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <RHFTextField name="nom" label="Nom" />
      <RHFSelect name="statut" label="Statut">
        <option value="actif">Actif</option>
      </RHFSelect>
      <Button type="submit" loading={isSubmitting}>Enregistrer</Button>
    </FormProvider>
  );
}
```

---

## Routage

### Ajouter une route publique
```jsx
// src/routes/index.jsx
{
  path: 'ma-page-publique',
  element: <MaPagePublique />,
}
```

### Ajouter une route protégée (auth requise)
```jsx
{
  path: 'dashboard',
  element: (
    <AuthGuard>
      <ModuleGuard>
        <DashboardLayout />
      </ModuleGuard>
    </AuthGuard>
  ),
  children: [
    { path: 'ma-feature/list', element: <MaFeatureList /> },
    { path: 'ma-feature/new', element: <MaFeatureNewEdit /> },
    { path: 'ma-feature/:id/edit', element: <MaFeatureNewEdit /> },
  ],
}
```

### Ajouter un chemin dans paths.js
```js
// src/routes/paths.js
export const PATH_DASHBOARD = {
  root: '/dashboard',
  maFeature: {
    list: '/dashboard/ma-feature/list',
    new: '/dashboard/ma-feature/new',
    edit: (id) => `/dashboard/ma-feature/${id}/edit`,
  },
};
```

---

## Thème et Styles

### Couleurs brand
```js
// Couleurs principales Faytek/Technologies Services
PRIMARY = "#1B4B8A"   // Bleu Faytek
SECONDARY = "#7AB929" // Vert
```

### Utiliser le thème MUI dans un composant
```jsx
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();
  return (
    <Box sx={{ bgcolor: theme.palette.primary.main, color: 'white', p: 2 }}>
      Contenu
    </Box>
  );
}
```

### Lazy loading obligatoire pour les pages
```jsx
// src/routes/index.jsx
const MaPage = Loadable(lazy(() => import('../pages/maFeature/MaPage')));
```

---

## Vérification des Permissions

### Dans un composant (rendu conditionnel)
```jsx
import CanAccess from '../../components/CanAccess';

<CanAccess module="da" action="creer">
  <Button>Nouvelle DA</Button>
</CanAccess>
```

### Dans la logique JS
```jsx
import { usePermissions } from '../../contexts/PermissionsContext';

function MyComponent() {
  const { can, isAdmin } = usePermissions();
  
  if (!can('da', 'voirListe')) return null;
  // ...
}
```

---

## Variables d'Environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_HOST_API_KEY` | URL de l'API backend | `https://api.monapp.vercel.app` |

> Toutes les variables Vite doivent commencer par `VITE_` pour être accessibles côté client.

Accès dans le code :
```js
// src/config.js
export const HOST_API = import.meta.env.VITE_HOST_API_KEY || 'http://localhost:5000';
```

---

## Comment Créer une Nouvelle Page/Feature (étapes)

### 1. Créer les fichiers de pages
```
src/pages/maFeature/MaFeatureList.jsx
src/pages/maFeature/MaFeatureNewEdit.jsx  (si CRUD)
```

### 2. Créer un slice Redux (si état partagé nécessaire)
```
src/redux/slices/maFeatureSlice.js
```

### 3. Ajouter au rootReducer
```js
import maFeatureReducer from './slices/maFeatureSlice';
const rootReducer = combineReducers({ ..., maFeature: maFeatureReducer });
```

### 4. Ajouter les routes
```js
// src/routes/paths.js — ajouter les chemins
// src/routes/index.jsx — ajouter les routes avec lazy loading
```

### 5. Ajouter à la navbar
```jsx
// src/layouts/dashboard/navbar/navConfigDA.jsx (ou Mission, DI, PA)
{
  title: 'Ma Feature',
  path: PATH_DASHBOARD.maFeature.list,
  icon: <Iconify icon="mdi:my-icon" />,
}
```

---

## Commandes Disponibles

```bash
npm run dev       # Développement Vite (http://localhost:5173)
npm run build     # Build production (dossier dist/)
npm run preview   # Prévisualiser le build local
npm run lint      # ESLint sur src/
```

---

## Points d'Attention pour Claude Code ⚠️

1. **JWT dans `localStorage`** — clé `accessToken`, pas de httpOnly cookie
2. **Header HTTP = `token`** (pas `Authorization`) — configuré dans `src/utils/axios.js`
3. **Ordre des Providers dans App.jsx** est critique — ne pas réorganiser : Redux → PersistGate → BrowserRouter → Theme → Auth → Permissions → Snackbar → Router
4. **Lazy loading obligatoire** pour toutes les pages via `Loadable(lazy(() => import(...)))`
5. **`useSelector` et autres hooks** doivent TOUJOURS être appelés avant tout `return` conditionnel (règle hooks React)
6. **`CanAccess`** est un composant, pas un hook — l'utiliser pour le rendu conditionnel UI
7. **Pas de couleurs hardcodées** — toujours utiliser `theme.palette.*` ou `sx={{ color: 'primary.main' }}`
8. **`navConfigDA`, `navConfigMission`, `navConfigDI`, `navConfigPA`** sont des configs séparées par module — ajouter les liens dans la bonne config
9. **`redux-persist`** est configuré avec `whitelist: []` par défaut — ajouter les slices à persister si nécessaire
10. **`vite.config.js`** et **`vercel.json`** existent — ne pas supprimer, requis pour le build et le déploiement
