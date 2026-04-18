const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
const Instance = require('../models/Instance');
const Action = require('../models/Action');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');

const USER_SELECT = 'nom prenom email';
const INSTANCE_POPULATE = [
  { path: 'responsable', select: USER_SELECT },
];
const ACTION_POPULATE = [
  { path: 'responsable', select: USER_SELECT },
  { path: 'responsableValidation', select: USER_SELECT },
  { path: 'instance', select: 'numero libelle' },
  { path: 'etat.by', select: USER_SELECT },
  { path: 'comments.user', select: USER_SELECT },
];

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: 'ID invalide' });
  next();
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

const instanceSchema = Joi.object({
  libelle: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  responsable: Joi.string().allow('', null).optional(),
  lieu: Joi.string().allow('').optional(),
  type: Joi.object({
    valeur: Joi.string().valid('Shared', 'Perso').default('Shared'),
    _id: Joi.string().allow(null, '').optional(),
  }).optional(),
  actif: Joi.boolean().optional(),
});

// GET /api/pa/instance — toutes
router.get('/instance', verifyToken, verifyPermission('pa', 'voir'), async (req, res, next) => {
  try {
    const items = await Instance.find().populate(INSTANCE_POPULATE).sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) { next(err); }
});

// GET /api/pa/instance/user/:userId — instances dont l'utilisateur est responsable
router.get('/instance/user/:userId', verifyToken, verifyPermission('pa', 'voir'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId))
      return res.status(400).json({ message: 'userId invalide' });
    const items = await Instance.find({
      $or: [
        { responsable: req.params.userId },
        { 'type.valeur': 'Shared' },
      ],
    })
      .populate(INSTANCE_POPULATE)
      .sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) { next(err); }
});

// GET /api/pa/instance/:id
router.get('/instance/:id', verifyToken, verifyPermission('pa', 'voir'), validateObjectId, async (req, res, next) => {
  try {
    const item = await Instance.findById(req.params.id).populate(INSTANCE_POPULATE);
    if (!item) return res.status(404).json({ message: 'Instance introuvable' });
    res.json({ data: item });
  } catch (err) { next(err); }
});

// POST /api/pa/instance
router.post('/instance', verifyToken, verifyPermission('pa', 'creer'), async (req, res, next) => {
  try {
    const { error, value } = instanceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    if (!value.responsable) delete value.responsable;
    const item = await Instance.create(value);
    await item.populate(INSTANCE_POPULATE);
    res.status(201).json({ message: 'Instance créée', data: item });
  } catch (err) { next(err); }
});

// PUT /api/pa/instance/:id
router.put('/instance/:id', verifyToken, verifyPermission('pa', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = instanceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    if (!value.responsable) value.responsable = undefined;
    const item = await Instance.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    }).populate(INSTANCE_POPULATE);
    if (!item) return res.status(404).json({ message: 'Instance introuvable' });
    res.json({ message: 'Instance mise à jour', data: item });
  } catch (err) { next(err); }
});

// DELETE /api/pa/instance/:id — cascade sur les actions
router.delete('/instance/:id', verifyToken, verifyPermission('pa', 'supprimer'), validateObjectId, async (req, res, next) => {
  try {
    const item = await Instance.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Instance introuvable' });
    await Action.deleteMany({ instance: req.params.id });
    res.json({ message: 'Instance supprimée' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTION
// ═══════════════════════════════════════════════════════════════════════════

const actionCreateSchema = Joi.object({
  description: Joi.string().required(),
  responsable: Joi.string().allow('', null).optional(),
  responsableValidation: Joi.string().allow('', null).optional(),
  instance: Joi.string().allow('', null).optional(),
  dateDeb: Joi.date().allow(null, '').optional(),
  dateFin: Joi.date().allow(null, '').optional(),
  priorite: Joi.string().valid('Haute', 'Moyenne', 'Basse').optional(),
  sourceModule: Joi.string().valid('nc', 'rc', 'diagnostic', 'standalone').optional(),
  sourceRef: Joi.string().allow('', null).optional(),
  sourceLabel: Joi.string().allow('').optional(),
});

const actionUpdateSchema = Joi.object({
  description: Joi.string(),
  responsable: Joi.string().allow('', null),
  responsableValidation: Joi.string().allow('', null),
  instance: Joi.string().allow('', null),
  dateDeb: Joi.date().allow(null, ''),
  dateFin: Joi.date().allow(null, ''),
  priorite: Joi.string().valid('Haute', 'Moyenne', 'Basse'),
  etat: Joi.array().items(
    Joi.object({
      etat: Joi.string().valid('Créée', 'Faite', 'Non Faite', 'Validée', 'Rejetée').required(),
      timestamp: Joi.date().optional(),
      by: Joi.string().optional(),
    })
  ),
  addEtat: Joi.object({
    etat: Joi.string().valid('Créée', 'Faite', 'Non Faite', 'Validée', 'Rejetée').required(),
  }),
  comments: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      user: Joi.alternatives().try(
        Joi.string(),
        Joi.object()
      ).optional(),
      message: Joi.string().required(),
      createdAt: Joi.date().optional(),
    })
  ),
  addComment: Joi.object({ message: Joi.string().required() }),
  addReport: Joi.object({
    motif: Joi.string().required(),
    nouvelleDate: Joi.date().required(),
  }),
});

const cleanRefs = (obj) => {
  const out = { ...obj };
  ['responsable', 'responsableValidation', 'instance', 'sourceRef'].forEach((k) => {
    if (out[k] === '' || out[k] === null) out[k] = undefined;
  });
  return out;
};

// GET /api/pa/action/list — toutes (avec filtres query : sourceModule, sourceRef, responsable)
router.get('/action/list', verifyToken, verifyPermission('pa', 'voir'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.sourceModule) filter.sourceModule = req.query.sourceModule;
    if (req.query.sourceRef && mongoose.Types.ObjectId.isValid(req.query.sourceRef))
      filter.sourceRef = req.query.sourceRef;
    if (req.query.responsable && mongoose.Types.ObjectId.isValid(req.query.responsable))
      filter.responsable = req.query.responsable;
    const actions = await Action.find(filter).populate(ACTION_POPULATE).sort({ createdAt: -1 });
    res.json({ data: actions });
  } catch (err) { next(err); }
});

// GET /api/pa/action/user/:userId — actions où l'utilisateur est responsable
router.get('/action/user/:userId', verifyToken, verifyPermission('pa', 'voir'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId))
      return res.status(400).json({ message: 'userId invalide' });
    const actions = await Action.find({
      $or: [
        { responsable: req.params.userId },
        { responsableValidation: req.params.userId },
      ],
    })
      .populate(ACTION_POPULATE)
      .sort({ createdAt: -1 });
    res.json({ data: actions });
  } catch (err) { next(err); }
});

// GET /api/pa/action/:instanceId — actions liées à une instance
router.get('/action/:instanceId', verifyToken, verifyPermission('pa', 'voir'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.instanceId))
      return res.status(400).json({ message: 'instanceId invalide' });
    const actions = await Action.find({ instance: req.params.instanceId })
      .populate(ACTION_POPULATE)
      .sort({ createdAt: -1 });
    res.json({ data: actions });
  } catch (err) { next(err); }
});

// POST /api/pa/action
router.post('/action', verifyToken, verifyPermission('pa', 'creer'), async (req, res, next) => {
  try {
    const { error, value } = actionCreateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const payload = cleanRefs(value);
    const action = await Action.create(payload);
    await action.populate(ACTION_POPULATE);
    res.status(201).json({ message: 'Action créée', data: action });
  } catch (err) { next(err); }
});

// PUT /api/pa/action/:id
router.put('/action/:id', verifyToken, verifyPermission('pa', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = actionUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const action = await Action.findById(req.params.id);
    if (!action) return res.status(404).json({ message: 'Action introuvable' });

    const payload = cleanRefs(value);

    // Merges progressifs pour les sous-docs (addEtat/addComment/addReport)
    if (payload.addEtat) {
      action.etat.push({ etat: payload.addEtat.etat, by: req.user._id, timestamp: new Date() });
      delete payload.addEtat;
    }
    if (payload.addComment) {
      action.comments.push({ user: req.user._id, message: payload.addComment.message });
      delete payload.addComment;
    }
    if (payload.addReport) {
      action.demandeReport.push({
        motif: payload.addReport.motif,
        ancienneDate: action.dateFin,
        nouvelleDate: payload.addReport.nouvelleDate,
      });
      action.dateFin = payload.addReport.nouvelleDate;
      action.nbReport = (action.nbReport || 0) + 1;
      delete payload.addReport;
    }

    // Champs directs
    Object.keys(payload).forEach((k) => {
      if (payload[k] !== undefined) action[k] = payload[k];
    });

    await action.save();
    await action.populate(ACTION_POPULATE);
    res.json({ message: 'Action mise à jour', data: action });
  } catch (err) { next(err); }
});

// DELETE /api/pa/action/:id
router.delete('/action/:id', verifyToken, verifyPermission('pa', 'supprimer'), validateObjectId, async (req, res, next) => {
  try {
    const item = await Action.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Action introuvable' });
    res.json({ message: 'Action supprimée' });
  } catch (err) { next(err); }
});

module.exports = router;
