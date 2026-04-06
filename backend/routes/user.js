const express = require('express');
const router = express.Router();
const Joi = require('joi');
const CryptoJS = require('crypto-js');
const User = require('../models/User');
const { verifyToken } = require('../middleware/verifyToken');

// ─── VALIDATION SCHEMA ───────────────────────────────────────────────────
const createSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  nom: Joi.string().required(),
  prenom: Joi.string().required(),
  profil: Joi.string().optional(),
  telephone: Joi.string().optional().allow(''),
  modules: Joi.array().items(Joi.string()).optional(),
  actif: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  nom: Joi.string().optional(),
  prenom: Joi.string().optional(),
  profil: Joi.string().optional(),
  telephone: Joi.string().optional().allow(''),
  modules: Joi.array().items(Joi.string()).optional(),
  actif: Joi.boolean().optional(),
});

// ─── GET / ────────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find().populate('profil').select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('profil').select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const existing = await User.findOne({ email: value.email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé' });

    // Hash password
    const hashedPassword = CryptoJS.AES.encrypt(
      value.password,
      process.env.CRYPTO_SECRET || 'faytek-secret'
    ).toString();

    const user = new User({
      ...value,
      email: value.email.toLowerCase(),
      password: hashedPassword,
    });

    await user.save();
    const { password: _pwd, ...userData } = user.toObject();
    res.status(201).json(userData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    if (value.password) {
      value.password = CryptoJS.AES.encrypt(
        value.password,
        process.env.CRYPTO_SECRET || 'faytek-secret'
      ).toString();
    }

    if (value.email) value.email = value.email.toLowerCase();

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true }
    )
      .populate('profil')
      .select('-password');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
