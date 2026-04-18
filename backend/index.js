require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
const { verifyToken } = require("./middleware/verifyToken");

// ─── ENVIRONMENT CHECK (fail-fast) ─────────────────────────────────────────
// Crash immédiat si une variable critique est manquante : on n'autorise plus
// aucun secret par défaut hardcodé en cas d'oubli de déploiement.
const REQUIRED_ENV = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "SESSION_SECRET",
  "MONGO_URI",
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(
    `[FATAL] Variables d'environnement manquantes : ${missing.join(", ")}`,
  );
  process.exit(1);
}

const isProd = process.env.NODE_ENV === "production";
const app = express();

// ─── SECURITY HEADERS (helmet) ─────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
const whitelist = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.DASHBOARD_URL,
].filter(Boolean);

// En développement : on accepte tous les origins localhost / 127.0.0.1 pour
// éviter les CORS errors dues aux ports fallback de Vite (3001, 5173…).
const isLocalhostOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) return callback(null, true);
    if (!isProd && isLocalhostOrigin(origin)) return callback(null, true);
    console.warn(`[CORS] Origin rejeté : ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  // credentials: true → indispensable pour que le navigateur envoie les cookies httpOnly
  credentials: true,
};

// Express 5 + path-to-regexp v8 : le wildcard '*' n'est plus accepté.
// Le middleware cors() répond automatiquement aux preflight OPTIONS,
// inutile de déclarer une route OPTIONS dédiée.
app.use(cors(corsOptions));

// ─── BODY / COOKIE PARSERS ─────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ─── SESSION ───────────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
    },
  }),
);

// ─── LAZY MONGODB CONNECTION (Vercel serverless) ───────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    // Mongoose 9 : useNewUrlParser et useUnifiedTopology sont supprimés.
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Faytek Starter API is running" });
});

// ─── ROUTES ────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/profil", require("./routes/profil"));
app.use("/api/non-conformite", require("./routes/nonConformite"));
app.use("/api/reclamation", require("./routes/reclamation"));
app.use("/api/process", require("./routes/process"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/pa", require("./routes/pa"));
app.use("/api/diagnostic", require("./routes/diagnostic"));
app.use("/api/diagnostic-referentiel", require("./routes/diagnosticReferentiel"));

// ─── PROTECTED STATIC UPLOADS ──────────────────────────────────────────────
// Les fichiers uploadés (avatars, documents) ne sont accessibles qu'avec un
// token valide. Évite que n'importe qui puisse récupérer une image par URL.
app.use(
  "/uploads",
  verifyToken,
  express.static(path.join(__dirname, "uploads"), {
    // On désactive l'index pour éviter l'énumération de répertoire
    index: false,
    dotfiles: "deny",
  }),
);

// ─── 404 HANDLER ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── ERROR HANDLER (masquage stack en prod) ────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  // En production : message générique. En dev : on expose pour debug.
  const message = isProd
    ? status >= 500
      ? "Erreur serveur interne"
      : err.message || "Erreur"
    : err.message || "Internal server error";
  res.status(status).json({ message });
});

// ─── START (dev only) ──────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
