const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { verifyToken } = require('../middleware/verifyToken');
const { generateToken } = require('../utils/token');

// ─── MULTER AVATAR ────────────────────────────────────────────────────────
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

// ─── POST /login ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis' });

    const user = await User.findOne({ email: email.toLowerCase() }).populate('profil');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (!user.actif) return res.status(403).json({ message: 'Compte désactivé' });

    // Decrypt password
    const bytes = CryptoJS.AES.decrypt(user.password, process.env.CRYPTO_SECRET || 'faytek-secret');
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (decrypted !== password)
      return res.status(401).json({ message: 'Mot de passe incorrect' });

    const accessToken = generateToken(user);

    const { password: _pwd, ...userData } = user.toObject();

    res.json({ accessToken, user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /my-account ─────────────────────────────────────────────────────
router.get('/my-account', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('profil')
      .select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /profile ─────────────────────────────────────────────────────────
router.put('/profile', verifyToken, upload.single('avatar'), async (req, res) => {
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
    )
      .populate('profil')
      .select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
