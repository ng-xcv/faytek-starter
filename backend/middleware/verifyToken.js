const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── verifyToken ────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['token'] || req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Token manquant' });

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// ─── verifyPermission ───────────────────────────────────────────────────────
const verifyPermission = (module, action) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('profil');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const profil = user.profil;
    if (!profil) return res.status(403).json({ message: 'Profil non assigné' });

    // Admin bypass
    if (profil.libelle === 'Admin') return next();

    // Check nested permissions: permissions[module][action]
    const perms = profil.permissions;
    if (
      perms &&
      perms[module] &&
      perms[module][action] === true
    ) {
      return next();
    }

    return res.status(403).json({ message: 'Permission insuffisante' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── verifyAdmin ────────────────────────────────────────────────────────────
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('profil');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const profil = user.profil;
    if (!profil) return res.status(403).json({ message: 'Profil non assigné' });

    if (profil.libelle === 'Admin') return next();

    // Check admin permissions flag
    const perms = profil.permissions;
    if (perms && perms.admin === true) return next();

    return res.status(403).json({ message: 'Accès admin requis' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { verifyToken, verifyPermission, verifyAdmin };
