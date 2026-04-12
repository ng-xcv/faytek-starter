const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mongoose = require('mongoose');
const XLSX = require('exceljs');
const NonConformite = require('../models/NonConformite');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');

// ─── VALIDATION SCHEMAS ─────────────────────────────────────────────────────
const createSchema = Joi.object({
  titre: Joi.string().required(),
  description: Joi.string().required(),
  type: Joi.string().valid('Processus', 'Produit', 'Service', 'Sécurité', 'Autre').required(),
  gravite: Joi.string().valid('Mineure', 'Majeure', 'Critique').required(),
  statut: Joi.string().valid('Ouverte', 'En cours', 'En attente', 'Clôturée'),
  dateDetection: Joi.date().required(),
  dateEcheance: Joi.date().allow(null).optional(),
  lieuDetection: Joi.string().allow('').optional(),
  detectePar: Joi.string().required(),
  responsable: Joi.string().allow('', null).optional(),
  actionCorrective: Joi.string().allow('').optional(),
  coutEstime: Joi.number().min(0).allow(null).optional(),
});

const updateSchema = Joi.object({
  titre: Joi.string(),
  description: Joi.string(),
  type: Joi.string().valid('Processus', 'Produit', 'Service', 'Sécurité', 'Autre'),
  gravite: Joi.string().valid('Mineure', 'Majeure', 'Critique'),
  statut: Joi.string().valid('Ouverte', 'En cours', 'En attente', 'Clôturée'),
  dateDetection: Joi.date(),
  dateEcheance: Joi.date().allow(null),
  lieuDetection: Joi.string().allow(''),
  responsable: Joi.string().allow('', null),
  actionCorrective: Joi.string().allow(''),
  coutEstime: Joi.number().min(0).allow(null),
});

const POPULATE_FIELDS = 'nom prenom email';

// ─── Helper : valide un ObjectId ────────────────────────────────────────────
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: 'ID invalide' });
  next();
};

// ─── Helper : construit les filtres depuis query params ─────────────────────
const buildFilters = (query) => {
  const filters = {};
  if (query.statut) filters.statut = query.statut;
  if (query.gravite) filters.gravite = query.gravite;
  if (query.responsable) filters.responsable = query.responsable;
  if (query.search) filters.titre = { $regex: query.search, $options: 'i' };
  if (query.dateDebut || query.dateFin) {
    filters.dateDetection = {};
    if (query.dateDebut) filters.dateDetection.$gte = new Date(query.dateDebut);
    if (query.dateFin) filters.dateDetection.$lte = new Date(query.dateFin);
  }
  return filters;
};

// ─── GET / ──────────────────────────────────────────────────────────────────
router.get('/', verifyToken, verifyPermission('nonConformites', 'voirListe'), async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const nonConformites = await NonConformite.find(filters)
      .populate('detectePar responsable', POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    res.json({ nonConformites });
  } catch (err) {
    next(err);
  }
});

// ─── GET /export/excel ──────────────────────────────────────────────────────
router.get('/export/excel', verifyToken, verifyPermission('nonConformites', 'exporter'), async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const ncs = await NonConformite.find(filters)
      .populate('detectePar responsable', POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    const workbook = new XLSX.Workbook();
    const sheet = workbook.addWorksheet('Non-conformités');

    sheet.columns = [
      { header: 'Référence', key: 'reference', width: 15 },
      { header: 'Titre', key: 'titre', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Gravité', key: 'gravite', width: 12 },
      { header: 'Statut', key: 'statut', width: 12 },
      { header: 'Date détection', key: 'dateDetection', width: 15 },
      { header: 'Date échéance', key: 'dateEcheance', width: 15 },
      { header: 'Lieu', key: 'lieuDetection', width: 20 },
      { header: 'Détecté par', key: 'detectePar', width: 20 },
      { header: 'Responsable', key: 'responsable', width: 20 },
      { header: 'Action corrective', key: 'actionCorrective', width: 30 },
      { header: 'Coût estimé', key: 'coutEstime', width: 15 },
    ];

    ncs.forEach((nc) => {
      sheet.addRow({
        reference: nc.reference,
        titre: nc.titre,
        type: nc.type,
        gravite: nc.gravite,
        statut: nc.statut,
        dateDetection: nc.dateDetection ? new Date(nc.dateDetection).toLocaleDateString('fr-FR') : '',
        dateEcheance: nc.dateEcheance ? new Date(nc.dateEcheance).toLocaleDateString('fr-FR') : '',
        lieuDetection: nc.lieuDetection || '',
        detectePar: nc.detectePar ? `${nc.detectePar.prenom} ${nc.detectePar.nom}` : '',
        responsable: nc.responsable ? `${nc.responsable.prenom} ${nc.responsable.nom}` : '',
        actionCorrective: nc.actionCorrective || '',
        coutEstime: nc.coutEstime ?? '',
      });
    });

    // Style header
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=non-conformites-${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id ───────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, verifyPermission('nonConformites', 'voir'), validateObjectId, async (req, res, next) => {
  try {
    const nonConformite = await NonConformite.findById(req.params.id)
      .populate('detectePar responsable', POPULATE_FIELDS);
    if (!nonConformite) return res.status(404).json({ message: 'Non-conformité introuvable' });
    res.json({ nonConformite });
  } catch (err) {
    next(err);
  }
});

// ─── POST / ─────────────────────────────────────────────────────────────────
router.post('/', verifyToken, verifyPermission('nonConformites', 'creer'), async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const nc = new NonConformite(value);
    await nc.save();
    await nc.populate('detectePar responsable', POPULATE_FIELDS);

    res.status(201).json({ message: 'Non-conformité créée avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id ───────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, verifyPermission('nonConformites', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const nc = await NonConformite.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true })
      .populate('detectePar responsable', POPULATE_FIELDS);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });

    res.json({ message: 'Non-conformité mise à jour avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id/valider ──────────────────────────────────────────────────────
router.put('/:id/valider', verifyToken, verifyPermission('nonConformites', 'valider'), validateObjectId, async (req, res, next) => {
  try {
    const nc = await NonConformite.findById(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });

    nc.statut = 'En cours';
    await nc.save();
    await nc.populate('detectePar responsable', POPULATE_FIELDS);

    res.json({ message: 'Non-conformité validée avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id/cloturer ─────────────────────────────────────────────────────
router.put('/:id/cloturer', verifyToken, verifyPermission('nonConformites', 'valider'), validateObjectId, async (req, res, next) => {
  try {
    const nc = await NonConformite.findById(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });

    nc.statut = 'Clôturée';
    nc.clotureLe = new Date();
    nc.clotureNote = req.body.note || '';
    await nc.save();
    await nc.populate('detectePar responsable', POPULATE_FIELDS);

    res.json({ message: 'Non-conformité clôturée avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id ────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, verifyPermission('nonConformites', 'supprimer'), validateObjectId, async (req, res, next) => {
  try {
    const nc = await NonConformite.findByIdAndDelete(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });
    res.json({ message: 'Non-conformité supprimée avec succès' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
