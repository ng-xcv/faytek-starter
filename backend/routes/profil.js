const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mongoose = require('mongoose');
const Profil = require('../models/Profil');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');
const { MODULES, ACTIONS } = require('../constants/permissions');

// ─── VALIDATION SCHEMA ──────────────────────────────────────────────────────
const profilSchema = Joi.object({
  nom: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  isAdmin: Joi.boolean(),
  actif: Joi.boolean(),
  permissions: Joi.object().pattern(
    Joi.string().valid(...MODULES),
    Joi.object().pattern(Joi.string().valid(...ACTIONS), Joi.boolean())
  ),
});

// ─── Helper : valide un ObjectId ────────────────────────────────────────────
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: 'ID invalide' });
  next();
};

// ─── GET / ──────────────────────────────────────────────────────────────────
router.get('/', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const profils = await Profil.find().sort({ createdAt: -1 });

    // Compter les utilisateurs par profil
    const profilsWithCount = await Promise.all(
      profils.map(async (p) => {
        const count = await User.countDocuments({ profil: p._id });
        return { ...p.toObject(), usersCount: count };
      })
    );

    res.json({ profils: profilsWithCount });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id ───────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, verifyAdmin, validateObjectId, async (req, res, next) => {
  try {
    const profil = await Profil.findById(req.params.id);
    if (!profil) return res.status(404).json({ message: 'Profil introuvable' });
    res.json({ profil });
  } catch (err) {
    next(err);
  }
});

// ─── POST / ─────────────────────────────────────────────────────────────────
router.post('/', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { error, value } = profilSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const existing = await Profil.findOne({ nom: value.nom });
    if (existing) return res.status(409).json({ message: 'Un profil avec ce nom existe déjà' });

    const profil = await Profil.create(value);
    res.status(201).json({ message: 'Profil créé avec succès', profil });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id ───────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, verifyAdmin, validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = profilSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const profil = await Profil.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!profil) return res.status(404).json({ message: 'Profil introuvable' });

    res.json({ message: 'Profil mis à jour avec succès', profil });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id ────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, verifyAdmin, validateObjectId, async (req, res, next) => {
  try {
    const profil = await Profil.findById(req.params.id);
    if (!profil) return res.status(404).json({ message: 'Profil introuvable' });

    if (profil.isAdmin)
      return res.status(400).json({ message: 'Le profil Administrateur ne peut pas être supprimé' });

    const count = await User.countDocuments({ profil: req.params.id });
    if (count > 0)
      return res.status(400).json({ message: `Impossible : ${count} utilisateur(s) rattaché(s) à ce profil` });

    await Profil.findByIdAndDelete(req.params.id);
    res.json({ message: 'Profil supprimé avec succès' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /seed ─────────────────────────────────────────────────────────────
router.post('/seed', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const defaults = [
      {
        nom: 'Administrateur',
        description: 'Accès total à toutes les fonctionnalités',
        isAdmin: true,
        actif: true,
      },
      {
        nom: 'Gestionnaire',
        description: 'Gestion complète des non-conformités',
        isAdmin: false,
        actif: true,
        permissions: {
          users: { voirListe: true, voir: true },
          profils: { voirListe: true, voir: true },
          nonConformites: { voirListe: true, voir: true, creer: true, modifier: true, supprimer: true, valider: true, exporter: true },
        },
      },
      {
        nom: 'Consultant',
        description: 'Consultation et export uniquement',
        isAdmin: false,
        actif: true,
        permissions: {
          users: { voirListe: true, voir: true },
          profils: { voirListe: true, voir: true },
          nonConformites: { voirListe: true, voir: true, exporter: true },
        },
      },
    ];

    const created = [];
    for (const def of defaults) {
      const exists = await Profil.findOne({ nom: def.nom });
      if (!exists) {
        const profil = await Profil.create(def);
        created.push(profil.nom);
      }
    }

    res.json({
      message: created.length > 0 ? `Profils créés : ${created.join(', ')}` : 'Tous les profils existent déjà',
      created,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
