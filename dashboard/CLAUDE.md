# CLAUDE.md — Dashboard Faytek Starter

> Interface dashboard moderne basee sur shadcn/ui + Tailwind CSS v4 + Framer Motion.
> Connecte au backend existant (Express/MongoDB) via cookies httpOnly.

---

## Stack & Versions

| Package | Version | Role |
|---|---|---|
| Vite | ^8.x | Bundler / Dev server |
| @vitejs/plugin-react | ^5.x | Plugin React |
| @tailwindcss/vite | ^4.x | Tailwind CSS v4 (plugin Vite) |
| React | ^19.x | UI Framework |
| React Router DOM | ^7.x | Routing SPA |
| Framer Motion | ^12.x | Animations |
| Axios | ^1.x | HTTP client (cookies httpOnly) |
| Lucide React | ^0.x | Icones |
| clsx + tailwind-merge | latest | Utilitaire classes CSS |
| class-variance-authority | latest | Variants composants |

---

## Structure des Dossiers

```
dashboard/src/
├── main.jsx                    ← Point d'entree React
├── App.jsx                     ← BrowserRouter → AuthProvider → Routes
├── config.js                   ← HOST_API
├── index.css                   ← Tailwind CSS v4 + theme custom
│
├── lib/
│   └── utils.js                ← cn() helper (clsx + twMerge)
│
├── utils/
│   └── axios.js                ← Instance Axios (withCredentials + auto-refresh 401)
│
├── contexts/
│   └── AuthContext.jsx          ← Auth JWT : login/logout/fetchUser + etat user
│
├── components/
│   ├── AuthGuard.jsx            ← Redirige /login si non authentifie
│   ├── GuestGuard.jsx           ← Redirige / si deja authentifie
│   ├── LoadingScreen.jsx        ← Ecran de chargement anime
│   └── ui/
│       ├── KpiCard.jsx          ← Carte indicateur cliquable animee
│       ├── ModuleCard.jsx       ← Carte module avec gradient + hover 3D
│       └── FlashTicker.jsx      ← Bande defilante messages flash
│
├── pages/
│   ├── auth/
│   │   └── Login.jsx            ← Page de connexion (glassmorphism + animations)
│   └── home/
│       └── Home.jsx             ← Selection module (KPIs + cards + ticker)
│
└── hooks/                       ← Hooks custom (a venir)
```

---

## Theme / Couleurs

Defini dans `src/index.css` via `@theme` (Tailwind CSS v4) :

```
PRIMARY = "#1B4B8A"    (Bleu Faytek)
SECONDARY = "#7AB929"  (Vert)
```

Utilisation : `bg-primary`, `text-secondary`, `border-primary/20`, etc.

---

## Connexion Backend

- **Auth = cookies httpOnly** (access 15min + refresh 7j)
- `axiosInstance` avec `withCredentials: true`
- Auto-refresh sur 401 via intercepteur
- Endpoints utilises :
  - `POST /api/auth/login` — connexion
  - `POST /api/auth/logout` — deconnexion
  - `POST /api/auth/refresh` — rafraichissement token
  - `GET /api/auth/my-account` — infos user connecte
  - `GET /api/non-conformite` — stats NC (KPIs)
  - `GET /api/user` — comptage utilisateurs (KPIs)

---

## Commandes

```bash
npm run dev       # Dev (http://localhost:5174)
npm run build     # Build production (dist/)
npm run preview   # Preview build local
```

---

## Points d'Attention

1. **Port 5174** — different du frontend principal (5173), ajoute au CORS backend
2. **Pas de localStorage pour les tokens** — cookies httpOnly uniquement
3. **Tailwind CSS v4** — syntaxe `@theme` dans index.css (pas de tailwind.config.js)
4. **Framer Motion** pour toutes les animations (pas de CSS keyframes manuels)
5. **Composants UI** dans `components/ui/` — style shadcn/ui (headless + Tailwind)
