const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mongoose = require('mongoose');
const User = require('../models/User');
const { verifyToken, verifyPermission, verifyAdmin } = require('../middleware/verifyToken');

// ─── VALIDATION SCHEMAS ─────────────────────────────────────────────────────
const createSchema = Joi.object({
  nom: Joi.string().required(),
  prenom: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  profil: Joi.string().required(),
  actif: Joi.boolean(),
});

const updateSchema = Joi.object({
  nom: Joi.string(),
  prenom: Joi.string(),
  email: Joi.string().email(),
  profil: Joi.string(),
  telephone: Joi.string().allow(''),
  actif: Joi.boolean(),
});

// ─── Helper : valide un ObjectId Mongo ──────────────────────────────────────
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: 'ID invalide' });
  next();
};

// ─── GET / ──────────────────────────────────────────────────────────────────
router.get('/', verifyToken, verifyPermission('admin', 'gererUtilisateurs'), async (req, res, next) => {
  try {
    const users = await User.find().populate('profil').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id ───────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, verifyPermission('admin', 'gererUtilisateurs'), validateObjectId, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('profil');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── POST / (admin) ────────────────────────────────────────────────────────
router.post('/', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const existing = await User.findOne({ email: value.email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé' });

    const user = new User({
      ...value,
      email: value.email.toLowerCase(),
    });
    await user.save();

    await user.populate('profil');
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokenHash;

    res.status(201).json({ message: 'Utilisateur créé avec succès', user: userObj });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id ───────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, verifyPermission('admin', 'gererUtilisateurs'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    if (value.email) value.email = value.email.toLowerCase();

    const user = await User.findByIdAndUpdate(req.params.id, value, { new: true }).populate('profil');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokenHash;

    res.json({ message: 'Utilisateur mis à jour avec succès', user: userObj });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id/password (admin) ──────────────────────────────────────────────
router.put('/:id/password', verifyToken, verifyAdmin, validateObjectId, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8)
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    user.password = password;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id (admin) ────────────────────────────────────────────────────
router.delete('/:id', verifyToken, verifyAdmin, validateObjectId, async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
