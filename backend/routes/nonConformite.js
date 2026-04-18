const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('exceljs');
const NonConformite = require('../models/NonConformite');
const Process = require('../models/Process');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');

// ─── SLA (en heures) — configurable via env ─────────────────────────────────
const SLA_DISPATCH_HOURS = Number(process.env.NC_SLA_DISPATCH_HOURS) || 48;
const SLA_TREATMENT_HOURS = Number(process.env.NC_SLA_TREATMENT_HOURS) || 24 * 7;
const SLA_CLOSURE_HOURS = Number(process.env.NC_SLA_CLOSURE_HOURS) || 72;
const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000);

// ─── MULTER : upload photos de NC ───────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'non-conformites');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `nc_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Image invalide'), ok);
  },
});

// ─── VALIDATION SCHEMAS ─────────────────────────────────────────────────────
const declareSchema = Joi.object({
  description: Joi.string().required(),
  consequences: Joi.string().required(),
  productOrService: Joi.string().valid('product', 'service').required(),
  productServiceName: Joi.string().required(),
  productServiceDescription: Joi.string().allow('').optional(),
});

const dispatchSchema = Joi.object({
  processes: Joi.array().items(Joi.string()).min(1).required(),
  dispatchNote: Joi.string().allow('').optional(),
});

const treatmentSchema = Joi.object({
  immediateCorrections: Joi.array().items(Joi.object({ description: Joi.string().required() })).optional(),
  causeAnalysis: Joi.object({
    method: Joi.string().valid('5M', 'Ishikawa', '5Y').required(),
    data: Joi.any(),
    conclusion: Joi.string().allow('').optional(),
  }).optional(),
  correctiveActions: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),
        description: Joi.string().required(),
        responsible: Joi.string().allow('', null).optional(),
        dueDate: Joi.date().allow(null).optional(),
        status: Joi.string().valid('planifiee', 'en_cours', 'realisee').optional(),
        evaluationCriteria: Joi.array()
          .items(
            Joi.object({
              _id: Joi.string().optional(),
              label: Joi.string().required(),
              score: Joi.number().min(0).max(100).allow(null).optional(),
              comment: Joi.string().allow('').optional(),
            })
          )
          .optional(),
        effectivenessScore: Joi.number().min(0).max(100).allow(null).optional(),
      })
    )
    .optional(),
  similarNCDetected: Joi.boolean().optional(),
  similarNCReferences: Joi.array().items(Joi.string()).optional(),
  similarNCNote: Joi.string().allow('').optional(),
  systemModificationRequired: Joi.boolean().optional(),
  systemModificationJustification: Joi.string().allow('').optional(),
  submitForClosure: Joi.boolean().optional(),
});

const closeSchema = Joi.object({
  closureComment: Joi.string().allow('').optional(),
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
const POPULATE = [
  { path: 'declaredBy', select: 'nom prenom email' },
  { path: 'dispatchedBy', select: 'nom prenom email' },
  { path: 'treatedBy', select: 'nom prenom email' },
  { path: 'closedBy', select: 'nom prenom email' },
  { path: 'processes', select: 'code name owner', populate: { path: 'owner', select: 'nom prenom email' } },
  { path: 'correctiveActions.responsible', select: 'nom prenom email' },
  { path: 'immediateCorrections.appliedBy', select: 'nom prenom email' },
  { path: 'similarNCReferences', select: 'reference description status' },
];

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: 'ID invalide' });
  next();
};

const buildFilters = (query) => {
  const filters = {};
  if (query.status) filters.status = query.status;
  if (query.process) filters.processes = query.process;
  if (query.productOrService) filters.productOrService = query.productOrService;
  if (query.search) filters.$or = [
    { reference: { $regex: query.search, $options: 'i' } },
    { description: { $regex: query.search, $options: 'i' } },
    { productServiceName: { $regex: query.search, $options: 'i' } },
  ];
  if (query.dateDebut || query.dateFin) {
    filters.createdAt = {};
    if (query.dateDebut) filters.createdAt.$gte = new Date(query.dateDebut);
    if (query.dateFin) filters.createdAt.$lte = new Date(query.dateFin);
  }
  return filters;
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET / — liste filtrable
router.get('/', verifyToken, verifyPermission('nc', 'voir'), async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);

    // Si l'utilisateur n'est pas admin et n'a pas le droit "voirTout", restreindre :
    // il voit ses déclarations + celles dispatchées à ses processus.
    const profil = req.user?.profil;
    if (profil && !profil.isAdmin && !profil.permissions?.nc?.voirTout) {
      const myProcesses = await Process.find({ owner: req.user._id }).select('_id');
      filters.$or = [
        ...(filters.$or || []),
        { declaredBy: req.user._id },
        { processes: { $in: myProcesses.map((p) => p._id) } },
      ];
    }

    const nonConformites = await NonConformite.find(filters).populate(POPULATE).sort({ createdAt: -1 });
    res.json({ nonConformites });
  } catch (err) {
    next(err);
  }
});

// GET /export/excel
router.get('/export/excel', verifyToken, verifyPermission('nc', 'exporter'), async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const ncs = await NonConformite.find(filters).populate(POPULATE).sort({ createdAt: -1 });

    const workbook = new XLSX.Workbook();
    const sheet = workbook.addWorksheet('Non-conformités');
    sheet.columns = [
      { header: 'Référence', key: 'reference', width: 16 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Déclarant', key: 'declarant', width: 22 },
      { header: 'Type', key: 'productOrService', width: 10 },
      { header: 'Produit/Service', key: 'productServiceName', width: 24 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Processus', key: 'processes', width: 24 },
      { header: 'Statut', key: 'status', width: 16 },
      { header: 'SLA', key: 'sla', width: 10 },
      { header: 'Actions correctives', key: 'actions', width: 40 },
      { header: 'Efficacité moyenne', key: 'efficacite', width: 14 },
      { header: 'Modif. système', key: 'systemMod', width: 14 },
      { header: 'Clôturée le', key: 'closedAt', width: 14 },
      { header: 'Commentaire clôture', key: 'closureComment', width: 36 },
    ];

    ncs.forEach((nc) => {
      const avg =
        nc.correctiveActions?.length
          ? Math.round(
              nc.correctiveActions.reduce((s, a) => s + (a.effectivenessScore || 0), 0) /
                nc.correctiveActions.length
            )
          : '';
      sheet.addRow({
        reference: nc.reference,
        date: nc.createdAt ? new Date(nc.createdAt).toLocaleDateString('fr-FR') : '',
        declarant: nc.declaredBy ? `${nc.declaredBy.prenom} ${nc.declaredBy.nom}` : '',
        productOrService: nc.productOrService === 'product' ? 'Produit' : 'Service',
        productServiceName: nc.productServiceName || '',
        description: nc.description || '',
        processes: (nc.processes || []).map((p) => p.code || p.name).join(', '),
        status: nc.status,
        sla: nc.slaStatus,
        actions: (nc.correctiveActions || []).map((a) => a.description).join(' | '),
        efficacite: avg,
        systemMod: nc.systemModificationRequired ? 'Oui' : 'Non',
        closedAt: nc.closedAt ? new Date(nc.closedAt).toLocaleDateString('fr-FR') : '',
        closureComment: nc.closureComment || '',
      });
    });
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=non-conformites-${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
});

// GET /stats — KPIs, répartitions et urgences pour le dashboard NC
router.get('/stats', verifyToken, verifyPermission('nc', 'voir'), async (req, res, next) => {
  try {
    const baseFilter = {};
    const profil = req.user?.profil;
    if (profil && !profil.isAdmin && !profil.permissions?.nc?.voirTout) {
      const myProcesses = await Process.find({ owner: req.user._id }).select('_id');
      baseFilter.$or = [
        { declaredBy: req.user._id },
        { processes: { $in: myProcesses.map((p) => p._id) } },
      ];
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const all = await NonConformite.find(baseFilter).select(
      'status declaredAt closedAt dueDispatchAt dueTreatmentAt dueClosureAt processes reference productServiceName productOrService causeAnalysis createdAt'
    );

    // ─── KPIs
    let totalOpen = 0;
    let overdue = 0;
    let closedThisMonth = 0;
    let sumClosureMs = 0;
    let closureCount = 0;

    all.forEach((nc) => {
      const isClosed = nc.status === 'closed';
      if (!isClosed) {
        totalOpen += 1;
        let due = null;
        if (nc.status === 'submitted') due = nc.dueDispatchAt;
        else if (nc.status === 'dispatched' || nc.status === 'in_treatment') due = nc.dueTreatmentAt;
        else if (nc.status === 'pending_closure') due = nc.dueClosureAt;
        if (due && new Date(due).getTime() < now.getTime()) overdue += 1;
      } else {
        if (nc.closedAt && new Date(nc.closedAt) >= startOfMonth) closedThisMonth += 1;
        if (nc.closedAt && nc.declaredAt) {
          sumClosureMs += new Date(nc.closedAt).getTime() - new Date(nc.declaredAt).getTime();
          closureCount += 1;
        }
      }
    });

    const avgClosureDays = closureCount
      ? Math.round((sumClosureMs / closureCount / (1000 * 3600 * 24)) * 10) / 10
      : 0;

    // ─── Répartition par statut
    const byStatusMap = {};
    all.forEach((nc) => {
      byStatusMap[nc.status] = (byStatusMap[nc.status] || 0) + 1;
    });
    const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

    // ─── Top 5 processus impactés
    const processCount = {};
    all.forEach((nc) => {
      (nc.processes || []).forEach((p) => {
        const key = String(p);
        processCount[key] = (processCount[key] || 0) + 1;
      });
    });
    const topProcessIds = Object.entries(processCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    const processDocs = await Process.find({ _id: { $in: topProcessIds } }).select('code name');
    const byProcess = topProcessIds.map((id) => {
      const doc = processDocs.find((d) => String(d._id) === id);
      return {
        _id: id,
        code: doc?.code || '',
        name: doc?.name || '',
        count: processCount[id],
      };
    });

    // ─── Répartition par type (produit / service) — plus représentatif que la méthode d'analyse
    const byTypeMap = { product: 0, service: 0 };
    all.forEach((nc) => {
      byTypeMap[nc.productOrService] = (byTypeMap[nc.productOrService] || 0) + 1;
    });
    const byType = [
      { type: 'product', label: 'Produit', count: byTypeMap.product },
      { type: 'service', label: 'Service', count: byTypeMap.service },
    ];

    // ─── Tendance 12 mois (créées vs clôturées)
    const monthlyMap = {};
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, created: 0, closed: 0 };
    }
    all.forEach((nc) => {
      if (nc.createdAt) {
        const d = new Date(nc.createdAt);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[k]) monthlyMap[k].created += 1;
      }
      if (nc.closedAt) {
        const d = new Date(nc.closedAt);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[k]) monthlyMap[k].closed += 1;
      }
    });
    const monthlyTrend = Object.values(monthlyMap);

    // ─── Urgences SLA (top 5 non clôturées triées par échéance)
    const urgencyCandidates = all
      .filter((nc) => nc.status !== 'closed')
      .map((nc) => {
        let due = null;
        if (nc.status === 'submitted') due = nc.dueDispatchAt;
        else if (nc.status === 'dispatched' || nc.status === 'in_treatment') due = nc.dueTreatmentAt;
        else if (nc.status === 'pending_closure') due = nc.dueClosureAt;
        let slaStatus = 'on_time';
        if (due) {
          const diff = new Date(due).getTime() - now.getTime();
          if (diff < 0) slaStatus = 'overdue';
          else if (diff < 12 * 3600 * 1000) slaStatus = 'at_risk';
        }
        return {
          _id: nc._id,
          reference: nc.reference,
          status: nc.status,
          productServiceName: nc.productServiceName,
          declaredAt: nc.declaredAt,
          dueDate: due,
          slaStatus,
        };
      })
      .filter((nc) => nc.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    res.json({
      kpis: { totalOpen, overdue, closedThisMonth, avgClosureDays },
      byStatus,
      byProcess,
      byType,
      monthlyTrend,
      urgencyTop5: urgencyCandidates,
    });
  } catch (err) {
    next(err);
  }
});

// GET /:id
router.get('/:id', verifyToken, verifyPermission('nc', 'voir'), validateObjectId, async (req, res, next) => {
  try {
    const nc = await NonConformite.findById(req.params.id).populate(POPULATE);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });
    res.json({ nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 1 : DÉCLARATION ─────────────────────────────────────────────────
// POST / — tout utilisateur authentifié ayant la permission "creer"
router.post('/', verifyToken, verifyPermission('nc', 'creer'), upload.array('photos', 6), async (req, res, next) => {
  try {
    const { error, value } = declareSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const photos = (req.files || []).map((f) => `/uploads/non-conformites/${f.filename}`);

    const nc = new NonConformite({
      ...value,
      photos,
      declaredBy: req.user._id,
      declaredAt: new Date(),
      status: 'submitted',
      dueDispatchAt: hoursFromNow(SLA_DISPATCH_HOURS),
    });
    await nc.save();
    await nc.populate(POPULATE);

    res.status(201).json({ message: 'Non-conformité déclarée avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 2 : DISPATCH (Responsable Qualité) ──────────────────────────────
router.put('/:id/dispatch', verifyToken, verifyPermission('nc', 'valider'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = dispatchSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const nc = await NonConformite.findById(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });
    if (nc.status !== 'submitted')
      return res.status(400).json({ message: 'NC déjà dispatchée ou dans un état avancé' });

    const invalid = value.processes.filter((p) => !mongoose.Types.ObjectId.isValid(p));
    if (invalid.length) return res.status(400).json({ message: 'Identifiant de processus invalide' });

    nc.processes = value.processes;
    nc.dispatchNote = value.dispatchNote || '';
    nc.dispatchedBy = req.user._id;
    nc.dispatchedAt = new Date();
    nc.status = 'dispatched';
    nc.dueTreatmentAt = hoursFromNow(SLA_TREATMENT_HOURS);
    await nc.save();
    await nc.populate(POPULATE);

    res.json({ message: 'Non-conformité dispatchée avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 3 : TRAITEMENT (Responsable de processus) ───────────────────────
router.put('/:id/treatment', verifyToken, verifyPermission('nc', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = treatmentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const nc = await NonConformite.findById(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });
    if (!['dispatched', 'in_treatment'].includes(nc.status))
      return res.status(400).json({ message: 'NC non traitable dans son état actuel' });

    // Vérification : l'utilisateur doit être owner d'un processus concerné (sauf admin)
    const profil = req.user?.profil;
    if (profil && !profil.isAdmin) {
      const myOwned = await Process.find({ owner: req.user._id, _id: { $in: nc.processes } }).select('_id');
      if (!myOwned.length)
        return res.status(403).json({ message: 'Vous n\'êtes pas pilote d\'un des processus concernés' });
    }

    if (value.immediateCorrections) {
      nc.immediateCorrections = value.immediateCorrections.map((c) => ({
        ...c,
        appliedBy: req.user._id,
        appliedAt: new Date(),
      }));
    }
    if (value.causeAnalysis) {
      nc.causeAnalysis = { ...value.causeAnalysis, analyzedAt: new Date() };
    }
    if (value.correctiveActions) {
      nc.correctiveActions = value.correctiveActions.map((a) => {
        const clean = { ...a };
        if (!clean.responsible) delete clean.responsible;
        return clean;
      });
    }
    if (typeof value.similarNCDetected === 'boolean') nc.similarNCDetected = value.similarNCDetected;
    if (value.similarNCReferences) nc.similarNCReferences = value.similarNCReferences;
    if (value.similarNCNote !== undefined) nc.similarNCNote = value.similarNCNote;
    if (typeof value.systemModificationRequired === 'boolean')
      nc.systemModificationRequired = value.systemModificationRequired;
    if (value.systemModificationJustification !== undefined)
      nc.systemModificationJustification = value.systemModificationJustification;

    nc.treatedBy = req.user._id;
    nc.treatedAt = new Date();

    if (value.submitForClosure) {
      nc.status = 'pending_closure';
      nc.dueClosureAt = hoursFromNow(SLA_CLOSURE_HOURS);
    } else if (nc.status === 'dispatched') {
      nc.status = 'in_treatment';
    }

    await nc.save();
    await nc.populate(POPULATE);

    res.json({ message: 'Traitement mis à jour avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 4 : CLÔTURE (Responsable Qualité) ───────────────────────────────
router.put('/:id/close', verifyToken, verifyPermission('nc', 'valider'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = closeSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const nc = await NonConformite.findById(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });
    if (nc.status !== 'pending_closure')
      return res.status(400).json({ message: 'Cette NC n\'est pas prête pour la clôture' });

    nc.status = 'closed';
    nc.closedBy = req.user._id;
    nc.closedAt = new Date();
    nc.closureComment = value.closureComment || '';
    await nc.save();
    await nc.populate(POPULATE);

    res.json({ message: 'Non-conformité clôturée avec succès', nonConformite: nc });
  } catch (err) {
    next(err);
  }
});

// ─── Upload de photos supplémentaires ──────────────────────────────────────
router.post('/:id/photos', verifyToken, verifyPermission('nc', 'modifier'), validateObjectId, upload.array('photos', 6), async (req, res, next) => {
  try {
    const nc = await NonConformite.findById(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });
    const photos = (req.files || []).map((f) => `/uploads/non-conformites/${f.filename}`);
    nc.photos = [...(nc.photos || []), ...photos];
    await nc.save();
    res.json({ message: 'Photos ajoutées', photos: nc.photos });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id
router.delete('/:id', verifyToken, verifyPermission('nc', 'supprimer'), validateObjectId, async (req, res, next) => {
  try {
    const nc = await NonConformite.findByIdAndDelete(req.params.id);
    if (!nc) return res.status(404).json({ message: 'Non-conformité introuvable' });
    res.json({ message: 'Non-conformité supprimée avec succès' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
