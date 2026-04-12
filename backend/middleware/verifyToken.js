const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── verifyToken ────────────────────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers['token'] ||
      req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id)
      .populate('profil')
      .select('-password -refreshTokenHash');

    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// ─── verifyPermission ───────────────────────────────────────────────────────
const verifyPermission = (module, action) => (req, res, next) => {
  const profil = req.user?.profil;
  if (!profil) return res.status(403).json({ message: 'Profil introuvable' });
  if (profil.isAdmin) return next();
  if (!profil.permissions?.[module]?.[action])
    return res.status(403).json({ message: `Permission refusée : ${module}.${action}` });
  next();
};

// ─── verifyAdmin ────────────────────────────────────────────────────────────
const verifyAdmin = (req, res, next) => {
  if (!req.user?.profil?.isAdmin)
    return res.status(403).json({ message: 'Accès administrateur requis' });
  next();
};

module.exports = { verifyToken, verifyPermission, verifyAdmin };
