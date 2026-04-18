const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
const Process = require('../models/Process');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');

const POPULATE_OWNER = 'nom prenom email';

const createSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  owner: Joi.string().allow('', null).optional(),
  actif: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  code: Joi.string(),
  name: Joi.string(),
  description: Joi.string().allow(''),
  owner: Joi.string().allow('', null),
  actif: Joi.boolean(),
});

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: 'ID invalide' });
  next();
};

// GET /api/process — liste
router.get('/', verifyToken, verifyPermission('process', 'voir'), async (req, res, next) => {
  try {
    const processes = await Process.find().populate('owner', POPULATE_OWNER).sort({ code: 1 });
    res.json({ processes });
  } catch (err) {
    next(err);
  }
});

// GET /api/process/:id
router.get('/:id', verifyToken, verifyPermission('process', 'voir'), validateObjectId, async (req, res, next) => {
  try {
    const item = await Process.findById(req.params.id).populate('owner', POPULATE_OWNER);
    if (!item) return res.status(404).json({ message: 'Processus introuvable' });
    res.json({ process: item });
  } catch (err) {
    next(err);
  }
});

// POST /api/process
router.post('/', verifyToken, verifyPermission('process', 'creer'), async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    if (!value.owner) delete value.owner;
    const item = await Process.create(value);
    await item.populate('owner', POPULATE_OWNER);
    res.status(201).json({ message: 'Processus créé avec succès', process: item });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Ce code de processus existe déjà' });
    next(err);
  }
});

// PUT /api/process/:id
router.put('/:id', verifyToken, verifyPermission('process', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    if (value.owner === '' || value.owner === null) value.owner = undefined;
    const item = await Process.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true }).populate(
      'owner',
      POPULATE_OWNER
    );
    if (!item) return res.status(404).json({ message: 'Processus introuvable' });
    res.json({ message: 'Processus mis à jour avec succès', process: item });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Ce code de processus existe déjà' });
    next(err);
  }
});

// DELETE /api/process/:id
router.delete('/:id', verifyToken, verifyPermission('process', 'supprimer'), validateObjectId, async (req, res, next) => {
  try {
    const item = await Process.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Processus introuvable' });
    res.json({ message: 'Processus supprimé avec succès' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
