const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { verifyToken } = require('../middleware/verifyToken');
const {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  accessCookieOptions,
  refreshCookieOptions,
} = require('../utils/token');

// ─── RATE LIMITER (login : 10 tentatives / 15 min / IP) ────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

// ─── MULTER AVATAR ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user._id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Image invalide'));
  },
});

// ─── Helper : pose les cookies access + refresh et persiste le hash ─────────
const issueTokens = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Stockage du hash du refresh token (rotation : un seul actif à la fois)
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();

  res.cookie('accessToken', accessToken, accessCookieOptions());
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
};

// ─── POST /login ───────────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis' });

    // .select('+password') car le champ est en select:false par défaut
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +refreshTokenHash')
      .populate('profil');

    // Message générique : ne pas révéler si l'email existe
    if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });
    if (!user.actif) return res.status(403).json({ message: 'Compte désactivé' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Identifiants incorrects' });

    await issueTokens(res, user);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokenHash;

    res.json({ user: userObj });
  } catch (err) {
    next(err);
  }
});

// ─── POST /refresh ─────────────────────────────────────────────────────────
// Rotation : on vérifie que le refresh token reçu correspond bien au hash en DB
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token manquant' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Refresh token invalide' });
    }

    const user = await User.findById(payload._id)
      .select('+refreshTokenHash')
      .populate('profil');

    if (!user || !user.actif) return res.status(401).json({ message: 'Utilisateur invalide' });

    // Vérification que le refresh token est bien celui en DB (sinon : révoqué/réutilisé)
    if (user.refreshTokenHash !== hashRefreshToken(refreshToken)) {
      // Sécurité : on invalide tout en cas de réutilisation suspecte
      user.refreshTokenHash = undefined;
      await user.save();
      return res.status(401).json({ message: 'Refresh token révoqué' });
    }

    await issueTokens(res, user);
    res.json({ message: 'Tokens rafraîchis' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /logout ──────────────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(payload._id, { $unset: { refreshTokenHash: 1 } });
      } catch {
        /* token déjà invalide : on poursuit la suppression des cookies */
      }
    }
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Déconnecté' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /my-account ───────────────────────────────────────────────────────
router.get('/my-account', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('profil');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /profile ──────────────────────────────────────────────────────────
router.put('/profile', verifyToken, upload.single('avatar'), async (req, res, next) => {
  try {
    const { nom, prenom, telephone } = req.body;
    const updateData = {};

    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (telephone) updateData.telephone = telephone;
    if (req.file) updateData.img = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).populate('profil');

    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
