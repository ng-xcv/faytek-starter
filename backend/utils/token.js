const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ─── Durées de vie ──────────────────────────────────────────────────────────
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

// ─── Génération access token (court : 15min) ────────────────────────────────
const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, profil: user.profil?.nom || 'Utilisateur' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
};

// ─── Génération refresh token (long : 7j) ───────────────────────────────────
const generateRefreshToken = (user) => {
  return jwt.sign(
    { _id: user._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
};

// ─── Hash SHA-256 du refresh token (stocké en DB pour rotation/révocation) ─
const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ─── Options cookies sécurisés ──────────────────────────────────────────────
const isProd = () => process.env.NODE_ENV === 'production';

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'strict' : 'lax',
  maxAge: ACCESS_TOKEN_TTL_MS,
  path: '/',
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? 'strict' : 'lax',
  maxAge: REFRESH_TOKEN_TTL_MS,
  // Limité au seul endpoint de refresh pour réduire la surface CSRF
  path: '/api/auth',
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  accessCookieOptions,
  refreshCookieOptions,
  // Compat ascendante (au cas où d'autres fichiers importeraient l'ancien nom)
  generateToken: generateAccessToken,
};
