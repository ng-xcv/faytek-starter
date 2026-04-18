const express = require('express');
const router = express.Router();
const Joi = require('joi');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('exceljs');
const Reclamation = require('../models/Reclamation');
const Process = require('../models/Process');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');

// ─── SLA (en heures) — configurable via env ─────────────────────────────────
const SLA_DISPATCH_HOURS = Number(process.env.RC_SLA_DISPATCH_HOURS) || 24;
const SLA_RESPONSE_HOURS = Number(process.env.RC_SLA_RESPONSE_HOURS) || 48;
const SLA_TREATMENT_HOURS = Number(process.env.RC_SLA_TREATMENT_HOURS) || 24 * 7;
const SLA_CLOSURE_HOURS = Number(process.env.RC_SLA_CLOSURE_HOURS) || 72;
const SURVEY_DELAY_DAYS = Number(process.env.RC_SURVEY_DELAY_DAYS) || 3;
const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000);
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 3600 * 1000);

// ─── MULTER : upload pièces de réclamation ──────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'reclamations');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `rc_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Fichier invalide'), ok);
  },
});

// ─── VALIDATION SCHEMAS ─────────────────────────────────────────────────────
const clientPayloadSchema = Joi.object({
  nom: Joi.string().required(),
  prenom: Joi.string().allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  telephone: Joi.string().allow('').optional(),
  societe: Joi.string().allow('').optional(),
  adresse: Joi.string().allow('').optional(),
});

const declareSchema = Joi.object({
  source: Joi.string().valid('employe', 'call', 'mail', 'sms', 'whatsapp').required(),
  sourceDetail: Joi.string().allow('').optional(),
  client: Joi.alternatives().try(clientPayloadSchema, Joi.string()).required(),
  objet: Joi.string().required(),
  description: Joi.string().required(),
  priorite: Joi.string().valid('basse', 'normale', 'haute', 'critique').optional(),
});

const dispatchSchema = Joi.object({
  processes: Joi.array().items(Joi.string()).min(1).required(),
  assignedTo: Joi.string().allow('', null).optional(),
  dispatchNote: Joi.string().allow('').optional(),
});

const responseSchema = Joi.object({
  message: Joi.string().required(),
  channel: Joi.string().valid('mail', 'call', 'sms', 'whatsapp', 'in_person').required(),
});

const analysisSchema = Joi.object({
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
  submitForClosure: Joi.boolean().optional(),
});

const feedbackSchema = Joi.object({
  effective: Joi.boolean().allow(null).optional(),
  rating: Joi.number().min(1).max(5).allow(null).optional(),
  comment: Joi.string().allow('').optional(),
});

const closeSchema = Joi.object({
  closureComment: Joi.string().allow('').optional(),
});

const surveySubmitSchema = Joi.object({
  scores: Joi.object({
    traitement: Joi.number().min(1).max(5).allow(null).optional(),
    delai: Joi.number().min(1).max(5).allow(null).optional(),
    communication: Joi.number().min(1).max(5).allow(null).optional(),
    resolution: Joi.number().min(1).max(5).allow(null).optional(),
  }).optional(),
  nps: Joi.number().min(0).max(10).allow(null).optional(),
  comment: Joi.string().allow('').optional(),
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
const POPULATE = [
  { path: 'declaredBy', select: 'nom prenom email' },
  { path: 'dispatchedBy', select: 'nom prenom email' },
  { path: 'assignedTo', select: 'nom prenom email' },
  { path: 'closedBy', select: 'nom prenom email' },
  { path: 'processes', select: 'code name owner', populate: { path: 'owner', select: 'nom prenom email' } },
  { path: 'correctiveActions.responsible', select: 'nom prenom email' },
  { path: 'clientResponses.sentBy', select: 'nom prenom email' },
  { path: 'clientFeedback.collectedBy', select: 'nom prenom email' },
  { path: 'satisfactionSurvey.sentBy', select: 'nom prenom email' },
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
  if (query.source) filters.source = query.source;
  if (query.priorite) filters.priorite = query.priorite;
  if (query.search) filters.$or = [
    { reference: { $regex: query.search, $options: 'i' } },
    { objet: { $regex: query.search, $options: 'i' } },
    { description: { $regex: query.search, $options: 'i' } },
    { 'client.nom': { $regex: query.search, $options: 'i' } },
    { 'client.email': { $regex: query.search, $options: 'i' } },
    { 'client.societe': { $regex: query.search, $options: 'i' } },
  ];
  if (query.dateDebut || query.dateFin) {
    filters.createdAt = {};
    if (query.dateDebut) filters.createdAt.$gte = new Date(query.dateDebut);
    if (query.dateFin) filters.createdAt.$lte = new Date(query.dateFin);
  }
  return filters;
};

const computeDue = (rc) => {
  if (rc.status === 'submitted') return rc.dueDispatchAt;
  if (rc.status === 'dispatched') return rc.dueResponseAt || rc.dueTreatmentAt;
  if (['responded', 'in_analysis', 'action_plan'].includes(rc.status)) return rc.dueTreatmentAt;
  if (rc.status === 'pending_closure') return rc.dueClosureAt;
  if (rc.status === 'survey_sent') return rc.dueSurveyAt;
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES (enquête de satisfaction par token)
// ═══════════════════════════════════════════════════════════════════════════

// GET /survey/:token — récupérer la fiche publique du sondage (sans auth)
router.get('/survey/:token', async (req, res, next) => {
  try {
    const rc = await Reclamation.findOne({ 'satisfactionSurvey.token': req.params.token })
      .select('reference objet client.nom client.prenom satisfactionSurvey closedAt');
    if (!rc) return res.status(404).json({ message: 'Sondage introuvable' });
    if (rc.satisfactionSurvey.responded)
      return res.status(400).json({ message: 'Sondage déjà soumis' });
    res.json({
      reference: rc.reference,
      objet: rc.objet,
      client: { nom: rc.client.nom, prenom: rc.client.prenom },
      sentAt: rc.satisfactionSurvey.sentAt,
    });
  } catch (err) {
    next(err);
  }
});

// POST /survey/:token/submit — soumission publique
router.post('/survey/:token/submit', async (req, res, next) => {
  try {
    const { error, value } = surveySubmitSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const rc = await Reclamation.findOne({ 'satisfactionSurvey.token': req.params.token });
    if (!rc) return res.status(404).json({ message: 'Sondage introuvable' });
    if (rc.satisfactionSurvey.responded)
      return res.status(400).json({ message: 'Sondage déjà soumis' });

    rc.satisfactionSurvey.scores = { ...rc.satisfactionSurvey.scores?.toObject?.() || {}, ...(value.scores || {}) };
    if (value.nps !== undefined) rc.satisfactionSurvey.nps = value.nps;
    if (value.comment !== undefined) rc.satisfactionSurvey.comment = value.comment;
    rc.satisfactionSurvey.responded = true;
    rc.satisfactionSurvey.respondedAt = new Date();
    rc.status = 'survey_completed';
    await rc.save();

    res.json({ message: 'Merci pour votre retour' });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES AUTHENTIFIÉES
// ═══════════════════════════════════════════════════════════════════════════

// GET / — liste filtrable
router.get('/', verifyToken, verifyPermission('rc', 'voir'), async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);

    const profil = req.user?.profil;
    if (profil && !profil.isAdmin && !profil.permissions?.rc?.voirTout) {
      const myProcesses = await Process.find({ owner: req.user._id }).select('_id');
      filters.$or = [
        ...(filters.$or || []),
        { declaredBy: req.user._id },
        { assignedTo: req.user._id },
        { processes: { $in: myProcesses.map((p) => p._id) } },
      ];
    }

    const reclamations = await Reclamation.find(filters).populate(POPULATE).sort({ createdAt: -1 });
    res.json({ reclamations });
  } catch (err) {
    next(err);
  }
});

// GET /export/excel
router.get('/export/excel', verifyToken, verifyPermission('rc', 'exporter'), async (req, res, next) => {
  try {
    const filters = buildFilters(req.query);
    const rcs = await Reclamation.find(filters).populate(POPULATE).sort({ createdAt: -1 });

    const workbook = new XLSX.Workbook();
    const sheet = workbook.addWorksheet('Réclamations');
    sheet.columns = [
      { header: 'Référence', key: 'reference', width: 16 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Source', key: 'source', width: 12 },
      { header: 'Client', key: 'client', width: 24 },
      { header: 'Société', key: 'societe', width: 20 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'Objet', key: 'objet', width: 28 },
      { header: 'Priorité', key: 'priorite', width: 10 },
      { header: 'Processus', key: 'processes', width: 24 },
      { header: 'Statut', key: 'status', width: 18 },
      { header: 'SLA', key: 'sla', width: 10 },
      { header: 'Réponses client', key: 'responses', width: 12 },
      { header: 'Efficacité moy.', key: 'efficacite', width: 14 },
      { header: 'Retour client', key: 'feedback', width: 14 },
      { header: 'Note client (1-5)', key: 'rating', width: 14 },
      { header: 'NPS (0-10)', key: 'nps', width: 12 },
      { header: 'Clôturée le', key: 'closedAt', width: 14 },
      { header: 'Commentaire clôture', key: 'closureComment', width: 36 },
    ];

    rcs.forEach((rc) => {
      const avg = rc.correctiveActions?.length
        ? Math.round(
            rc.correctiveActions.reduce((s, a) => s + (a.effectivenessScore || 0), 0) /
              rc.correctiveActions.length
          )
        : '';
      sheet.addRow({
        reference: rc.reference,
        date: rc.createdAt ? new Date(rc.createdAt).toLocaleDateString('fr-FR') : '',
        source: rc.source,
        client: `${rc.client?.prenom || ''} ${rc.client?.nom || ''}`.trim(),
        societe: rc.client?.societe || '',
        email: rc.client?.email || '',
        objet: rc.objet || '',
        priorite: rc.priorite,
        processes: (rc.processes || []).map((p) => p.code || p.name).join(', '),
        status: rc.status,
        sla: rc.slaStatus,
        responses: (rc.clientResponses || []).length,
        efficacite: avg,
        feedback: rc.clientFeedback?.received
          ? rc.clientFeedback.effective
            ? 'Résolu'
            : 'Non résolu'
          : '',
        rating: rc.clientFeedback?.rating ?? '',
        nps: rc.satisfactionSurvey?.nps ?? '',
        closedAt: rc.closedAt ? new Date(rc.closedAt).toLocaleDateString('fr-FR') : '',
        closureComment: rc.closureComment || '',
      });
    });
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reclamations-${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
});

// GET /stats — KPIs dashboard
router.get('/stats', verifyToken, verifyPermission('rc', 'voir'), async (req, res, next) => {
  try {
    const baseFilter = {};
    const profil = req.user?.profil;
    if (profil && !profil.isAdmin && !profil.permissions?.rc?.voirTout) {
      const myProcesses = await Process.find({ owner: req.user._id }).select('_id');
      baseFilter.$or = [
        { declaredBy: req.user._id },
        { assignedTo: req.user._id },
        { processes: { $in: myProcesses.map((p) => p._id) } },
      ];
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const all = await Reclamation.find(baseFilter).select(
      'status source priorite declaredAt closedAt dueDispatchAt dueResponseAt dueTreatmentAt dueClosureAt dueSurveyAt processes reference objet client clientFeedback satisfactionSurvey createdAt'
    );

    let totalOpen = 0;
    let overdue = 0;
    let closedThisMonth = 0;
    let sumClosureMs = 0;
    let closureCount = 0;
    let satisfactionSent = 0;
    let satisfactionResponded = 0;
    let npsSum = 0;
    let npsCount = 0;
    let effectiveCount = 0;
    let feedbackCount = 0;

    all.forEach((rc) => {
      const isClosed = ['closed', 'survey_sent', 'survey_completed'].includes(rc.status);
      if (!isClosed) {
        totalOpen += 1;
        const due = computeDue(rc);
        if (due && new Date(due).getTime() < now.getTime()) overdue += 1;
      } else {
        if (rc.closedAt && new Date(rc.closedAt) >= startOfMonth) closedThisMonth += 1;
        if (rc.closedAt && rc.declaredAt) {
          sumClosureMs += new Date(rc.closedAt).getTime() - new Date(rc.declaredAt).getTime();
          closureCount += 1;
        }
      }
      if (rc.satisfactionSurvey?.sent) satisfactionSent += 1;
      if (rc.satisfactionSurvey?.responded) {
        satisfactionResponded += 1;
        if (rc.satisfactionSurvey.nps != null) {
          npsSum += rc.satisfactionSurvey.nps;
          npsCount += 1;
        }
      }
      if (rc.clientFeedback?.received) {
        feedbackCount += 1;
        if (rc.clientFeedback.effective) effectiveCount += 1;
      }
    });

    const avgClosureDays = closureCount
      ? Math.round((sumClosureMs / closureCount / (1000 * 3600 * 24)) * 10) / 10
      : 0;
    const satisfactionRate = satisfactionSent
      ? Math.round((satisfactionResponded / satisfactionSent) * 100)
      : 0;
    const avgNps = npsCount ? Math.round((npsSum / npsCount) * 10) / 10 : 0;
    const effectivenessRate = feedbackCount ? Math.round((effectiveCount / feedbackCount) * 100) : 0;

    // Répartition par statut
    const byStatusMap = {};
    all.forEach((rc) => {
      byStatusMap[rc.status] = (byStatusMap[rc.status] || 0) + 1;
    });
    const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

    // Répartition par canal source
    const bySourceMap = {};
    all.forEach((rc) => {
      bySourceMap[rc.source] = (bySourceMap[rc.source] || 0) + 1;
    });
    const bySource = Object.entries(bySourceMap).map(([source, count]) => ({ source, count }));

    // Répartition par priorité
    const byPrioriteMap = {};
    all.forEach((rc) => {
      byPrioriteMap[rc.priorite] = (byPrioriteMap[rc.priorite] || 0) + 1;
    });
    const byPriorite = Object.entries(byPrioriteMap).map(([priorite, count]) => ({ priorite, count }));

    // Top 5 processus
    const processCount = {};
    all.forEach((rc) => {
      (rc.processes || []).forEach((p) => {
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

    // Tendance 12 mois
    const monthlyMap = {};
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, created: 0, closed: 0 };
    }
    all.forEach((rc) => {
      if (rc.createdAt) {
        const d = new Date(rc.createdAt);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[k]) monthlyMap[k].created += 1;
      }
      if (rc.closedAt) {
        const d = new Date(rc.closedAt);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap[k]) monthlyMap[k].closed += 1;
      }
    });
    const monthlyTrend = Object.values(monthlyMap);

    // Urgences SLA
    const urgencyTop5 = all
      .filter((rc) => !['closed', 'survey_sent', 'survey_completed'].includes(rc.status))
      .map((rc) => {
        const due = computeDue(rc);
        let slaStatus = 'on_time';
        if (due) {
          const diff = new Date(due).getTime() - now.getTime();
          if (diff < 0) slaStatus = 'overdue';
          else if (diff < 12 * 3600 * 1000) slaStatus = 'at_risk';
        }
        return {
          _id: rc._id,
          reference: rc.reference,
          status: rc.status,
          objet: rc.objet,
          client: rc.client?.nom,
          declaredAt: rc.declaredAt,
          dueDate: due,
          slaStatus,
        };
      })
      .filter((rc) => rc.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    res.json({
      kpis: {
        totalOpen,
        overdue,
        closedThisMonth,
        avgClosureDays,
        satisfactionRate,
        avgNps,
        effectivenessRate,
      },
      byStatus,
      bySource,
      byPriorite,
      byProcess,
      monthlyTrend,
      urgencyTop5,
    });
  } catch (err) {
    next(err);
  }
});

// GET /:id
router.get('/:id', verifyToken, verifyPermission('rc', 'voir'), validateObjectId, async (req, res, next) => {
  try {
    const rc = await Reclamation.findById(req.params.id).populate(POPULATE);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    res.json({ reclamation: rc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 1 : DÉCLARATION ─────────────────────────────────────────────────
router.post('/', verifyToken, verifyPermission('rc', 'creer'), upload.array('pieces', 6), async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (typeof body.client === 'string') {
      try {
        body.client = JSON.parse(body.client);
      } catch (e) {
        return res.status(400).json({ message: 'Champ client invalide (JSON attendu)' });
      }
    }
    const { error, value } = declareSchema.validate(body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const pieces = (req.files || []).map((f) => `/uploads/reclamations/${f.filename}`);

    const rc = new Reclamation({
      ...value,
      pieces,
      declaredBy: req.user._id,
      declaredAt: new Date(),
      status: 'submitted',
      dueDispatchAt: hoursFromNow(SLA_DISPATCH_HOURS),
    });
    await rc.save();
    await rc.populate(POPULATE);

    res.status(201).json({ message: 'Réclamation enregistrée avec succès', reclamation: rc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 2 : DISPATCH ────────────────────────────────────────────────────
router.put('/:id/dispatch', verifyToken, verifyPermission('rc', 'valider'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = dispatchSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const rc = await Reclamation.findById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    if (rc.status !== 'submitted')
      return res.status(400).json({ message: 'Réclamation déjà dispatchée' });

    const invalid = value.processes.filter((p) => !mongoose.Types.ObjectId.isValid(p));
    if (invalid.length) return res.status(400).json({ message: 'Identifiant de processus invalide' });
    if (value.assignedTo && !mongoose.Types.ObjectId.isValid(value.assignedTo))
      return res.status(400).json({ message: 'Identifiant utilisateur invalide' });

    rc.processes = value.processes;
    if (value.assignedTo) rc.assignedTo = value.assignedTo;
    rc.dispatchNote = value.dispatchNote || '';
    rc.dispatchedBy = req.user._id;
    rc.dispatchedAt = new Date();
    rc.status = 'dispatched';
    rc.dueResponseAt = hoursFromNow(SLA_RESPONSE_HOURS);
    rc.dueTreatmentAt = hoursFromNow(SLA_TREATMENT_HOURS);
    await rc.save();
    await rc.populate(POPULATE);

    res.json({ message: 'Réclamation dispatchée avec succès', reclamation: rc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 3 : RÉPONSE AU CLIENT (thread) ──────────────────────────────────
router.post('/:id/response', verifyToken, verifyPermission('rc', 'modifier'), validateObjectId, upload.array('attachments', 4), async (req, res, next) => {
  try {
    const { error, value } = responseSchema.validate({ message: req.body.message, channel: req.body.channel });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const rc = await Reclamation.findById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    if (['closed', 'survey_sent', 'survey_completed'].includes(rc.status))
      return res.status(400).json({ message: 'Réclamation clôturée' });

    const attachments = (req.files || []).map((f) => `/uploads/reclamations/${f.filename}`);
    rc.clientResponses.push({
      message: value.message,
      channel: value.channel,
      sentBy: req.user._id,
      sentAt: new Date(),
      attachments,
    });

    if (rc.status === 'dispatched') rc.status = 'responded';
    await rc.save();
    await rc.populate(POPULATE);

    res.json({ message: 'Réponse enregistrée', reclamation: rc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 4-5 : ANALYSE CAUSES + PLAN D'ACTION ────────────────────────────
router.put('/:id/analysis', verifyToken, verifyPermission('rc', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = analysisSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const rc = await Reclamation.findById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    if (['closed', 'survey_sent', 'survey_completed'].includes(rc.status))
      return res.status(400).json({ message: 'Réclamation clôturée' });

    const profil = req.user?.profil;
    if (profil && !profil.isAdmin) {
      const myOwned = await Process.find({ owner: req.user._id, _id: { $in: rc.processes } }).select('_id');
      const isAssigned = rc.assignedTo && String(rc.assignedTo) === String(req.user._id);
      if (!myOwned.length && !isAssigned)
        return res.status(403).json({ message: "Vous n'êtes pas responsable de cette réclamation" });
    }

    if (value.causeAnalysis) {
      rc.causeAnalysis = {
        ...value.causeAnalysis,
        analyzedAt: new Date(),
        analyzedBy: req.user._id,
      };
      if (rc.status === 'responded' || rc.status === 'dispatched') rc.status = 'in_analysis';
    }
    if (value.correctiveActions) {
      rc.correctiveActions = value.correctiveActions.map((a) => {
        const clean = { ...a };
        if (!clean.responsible) delete clean.responsible;
        return clean;
      });
      if (rc.correctiveActions.length && rc.status === 'in_analysis') rc.status = 'action_plan';
    }

    if (value.submitForClosure) {
      rc.status = 'pending_closure';
      rc.dueClosureAt = hoursFromNow(SLA_CLOSURE_HOURS);
    }

    await rc.save();
    await rc.populate(POPULATE);

    res.json({ message: 'Analyse mise à jour', reclamation: rc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 6 : RETOUR CLIENT (efficacité) ──────────────────────────────────
router.put('/:id/feedback', verifyToken, verifyPermission('rc', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = feedbackSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const rc = await Reclamation.findById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });

    rc.clientFeedback = {
      received: true,
      receivedAt: new Date(),
      effective: value.effective ?? null,
      rating: value.rating ?? null,
      comment: value.comment || '',
      collectedBy: req.user._id,
    };
    if (!['closed', 'survey_sent', 'survey_completed'].includes(rc.status)) {
      rc.status = 'pending_closure';
      if (!rc.dueClosureAt) rc.dueClosureAt = hoursFromNow(SLA_CLOSURE_HOURS);
    }
    await rc.save();
    await rc.populate(POPULATE);

    res.json({ message: 'Retour client enregistré', reclamation: rc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 7 : CLÔTURE ─────────────────────────────────────────────────────
router.put('/:id/close', verifyToken, verifyPermission('rc', 'valider'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = closeSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const rc = await Reclamation.findById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    if (rc.status !== 'pending_closure')
      return res.status(400).json({ message: "Cette réclamation n'est pas prête pour la clôture" });

    rc.status = 'closed';
    rc.closedBy = req.user._id;
    rc.closedAt = new Date();
    rc.closureComment = value.closureComment || '';
    await rc.save();
    await rc.populate(POPULATE);

    res.json({ message: 'Réclamation clôturée avec succès', reclamation: rc });
  } catch (err) {
    next(err);
  }
});

// ─── ÉTAPE 8 : ENQUÊTE DE SATISFACTION ─────────────────────────────────────
router.post('/:id/survey/send', verifyToken, verifyPermission('rc', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const rc = await Reclamation.findById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    if (rc.status !== 'closed')
      return res.status(400).json({ message: 'Réclamation non clôturée' });
    if (!rc.client?.email)
      return res.status(400).json({ message: 'Le client n\'a pas d\'email enregistré' });

    rc.satisfactionSurvey.token = crypto.randomBytes(24).toString('hex');
    rc.satisfactionSurvey.sent = true;
    rc.satisfactionSurvey.sentAt = new Date();
    rc.satisfactionSurvey.sentBy = req.user._id;
    rc.dueSurveyAt = daysFromNow(SURVEY_DELAY_DAYS);
    rc.status = 'survey_sent';
    await rc.save();
    await rc.populate(POPULATE);

    // L'envoi email réel est délégué à une étape ultérieure (nodemailer).
    // On retourne le lien public pour permettre au front d'afficher / copier.
    const publicUrl = `${process.env.FRONTEND_URL || ''}/satisfaction/${rc.satisfactionSurvey.token}`;
    res.json({ message: 'Enquête envoyée', reclamation: rc, publicUrl });
  } catch (err) {
    next(err);
  }
});

// ─── Pièces supplémentaires ────────────────────────────────────────────────
router.post('/:id/pieces', verifyToken, verifyPermission('rc', 'modifier'), validateObjectId, upload.array('pieces', 6), async (req, res, next) => {
  try {
    const rc = await Reclamation.findById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    const pieces = (req.files || []).map((f) => `/uploads/reclamations/${f.filename}`);
    rc.pieces = [...(rc.pieces || []), ...pieces];
    await rc.save();
    res.json({ message: 'Pièces ajoutées', pieces: rc.pieces });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id
router.delete('/:id', verifyToken, verifyPermission('rc', 'supprimer'), validateObjectId, async (req, res, next) => {
  try {
    const rc = await Reclamation.findByIdAndDelete(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Réclamation introuvable' });
    res.json({ message: 'Réclamation supprimée avec succès' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
