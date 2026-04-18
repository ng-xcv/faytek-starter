const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

const Diagnostic = require('../models/Diagnostic');
const DiagnosticReponse = require('../models/DiagnosticReponse');
const DiagnosticReferentiel = require('../models/DiagnosticReferentiel');
const Action = require('../models/Action');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');
const { computeScores } = require('../utils/diagnosticScore');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: 'ID invalide' });
  next();
};

const POPULATE = [
  { path: 'evaluateur', select: 'nom prenom email' },
  { path: 'completedBy', select: 'nom prenom email' },
];

// ─── VALIDATION ─────────────────────────────────────────────────────────────
const createSchema = Joi.object({
  organisme: Joi.string().required(),
  perimetre: Joi.string().allow('').optional(),
  date: Joi.date().optional(),
  normesActivees: Joi.array()
    .items(Joi.string().valid('iso9001', 'iso14001', 'iso45001'))
    .min(1)
    .required(),
});

const updateSchema = Joi.object({
  organisme: Joi.string().optional(),
  perimetre: Joi.string().allow('').optional(),
  date: Joi.date().optional(),
  normesActivees: Joi.array()
    .items(Joi.string().valid('iso9001', 'iso14001', 'iso45001'))
    .min(1)
    .optional(),
  status: Joi.string().valid('draft', 'in_progress', 'completed', 'archived').optional(),
});

const answerSchema = Joi.object({
  referentiel: Joi.string().valid('iso9001', 'iso14001', 'iso45001').required(),
  questionIdx: Joi.number().integer().min(0).required(),
  cotation: Joi.string().valid('0', '0.33', '0.66', '1', 'NA').allow(null),
  observation: Joi.string().allow('').optional(),
});

// ─── HELPERS ────────────────────────────────────────────────────────────────

// Recalcule et persiste les scores du diagnostic (cache).
async function refreshScores(diagnosticId) {
  const diag = await Diagnostic.findById(diagnosticId);
  if (!diag) return null;
  const refs = await DiagnosticReferentiel.find({ code: { $in: diag.normesActivees } });
  const refMap = new Map(refs.map((r) => [r.code, r]));
  const reponses = await DiagnosticReponse.find({ diagnostic: diagnosticId });
  const { scoreGlobal, scoresParNorme, scoresParChapitre } = computeScores(
    reponses,
    refMap,
    diag.normesActivees
  );
  diag.scoreGlobal = scoreGlobal;
  diag.scoresParNorme = scoresParNorme;
  diag.scoresParChapitre = scoresParChapitre;
  // bascule auto draft → in_progress dès qu'au moins 1 réponse existe
  if (reponses.length > 0 && diag.status === 'draft') diag.status = 'in_progress';
  await diag.save();
  return diag;
}

// Filtre de scope : si pas voirTout, ne voit que ses propres campagnes
function scopeFilter(req) {
  const profil = req.user.profil;
  if (profil.isAdmin) return {};
  if (profil.permissions?.diagnostic?.voirTout) return {};
  return { evaluateur: req.user._id };
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTE / CRUD
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/diagnostic
router.get('/', verifyToken, verifyPermission('diagnostic', 'voir'), async (req, res, next) => {
  try {
    const filter = scopeFilter(req);
    if (req.query.status) filter.status = req.query.status;
    const items = await Diagnostic.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) { next(err); }
});

// POST /api/diagnostic
router.post('/', verifyToken, verifyPermission('diagnostic', 'creer'), async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const item = await Diagnostic.create({ ...value, evaluateur: req.user._id });
    await item.populate(POPULATE);
    res.status(201).json({ message: 'Diagnostic créé', data: item });
  } catch (err) { next(err); }
});

// GET /api/diagnostic/:id — campagne + toutes les réponses
router.get('/:id', verifyToken, verifyPermission('diagnostic', 'voir'), validateObjectId, async (req, res, next) => {
  try {
    const item = await Diagnostic.findById(req.params.id).populate(POPULATE);
    if (!item) return res.status(404).json({ message: 'Diagnostic introuvable' });
    const reponses = await DiagnosticReponse.find({ diagnostic: req.params.id });
    res.json({ data: item, reponses });
  } catch (err) { next(err); }
});

// PUT /api/diagnostic/:id
router.put('/:id', verifyToken, verifyPermission('diagnostic', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const item = await Diagnostic.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    }).populate(POPULATE);
    if (!item) return res.status(404).json({ message: 'Diagnostic introuvable' });
    res.json({ message: 'Diagnostic mis à jour', data: item });
  } catch (err) { next(err); }
});

// DELETE /api/diagnostic/:id
router.delete('/:id', verifyToken, verifyPermission('diagnostic', 'supprimer'), validateObjectId, async (req, res, next) => {
  try {
    const item = await Diagnostic.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Diagnostic introuvable' });
    await DiagnosticReponse.deleteMany({ diagnostic: req.params.id });
    res.json({ message: 'Diagnostic supprimé' });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════
// COTATION
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/diagnostic/:id/answer — upsert d'une réponse
router.put('/:id/answer', verifyToken, verifyPermission('diagnostic', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const { error, value } = answerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const diag = await Diagnostic.findById(req.params.id);
    if (!diag) return res.status(404).json({ message: 'Diagnostic introuvable' });
    if (diag.status === 'archived') return res.status(400).json({ message: 'Diagnostic archivé, en lecture seule' });
    if (!diag.normesActivees.includes(value.referentiel))
      return res.status(400).json({ message: 'Référentiel non activé pour ce diagnostic' });

    const filter = {
      diagnostic: req.params.id,
      referentiel: value.referentiel,
      questionIdx: value.questionIdx,
    };

    let saved;
    if (value.cotation === null || value.cotation === undefined) {
      // Désélection : supprime la réponse
      await DiagnosticReponse.deleteOne(filter);
      saved = null;
    } else {
      saved = await DiagnosticReponse.findOneAndUpdate(
        filter,
        { $set: { cotation: value.cotation, observation: value.observation || '' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const refreshed = await refreshScores(req.params.id);
    res.json({ message: 'Réponse enregistrée', data: saved, diagnostic: refreshed });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETION
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/diagnostic/:id/complete
router.put('/:id/complete', verifyToken, verifyPermission('diagnostic', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const diag = await Diagnostic.findById(req.params.id);
    if (!diag) return res.status(404).json({ message: 'Diagnostic introuvable' });
    diag.status = 'completed';
    diag.completedAt = new Date();
    diag.completedBy = req.user._id;
    await diag.save();
    await refreshScores(diag._id);
    const refreshed = await Diagnostic.findById(diag._id).populate(POPULATE);
    res.json({ message: 'Diagnostic clôturé', data: refreshed });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GENERATION D'ACTIONS PA (depuis les écarts)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/diagnostic/:id/generate-actions
// Crée une Action PA pour chaque réponse '0' ou '0.33' qui n'a pas encore d'action.
router.post('/:id/generate-actions', verifyToken, verifyPermission('diagnostic', 'modifier'), validateObjectId, async (req, res, next) => {
  try {
    const diag = await Diagnostic.findById(req.params.id);
    if (!diag) return res.status(404).json({ message: 'Diagnostic introuvable' });

    const ecarts = await DiagnosticReponse.find({
      diagnostic: req.params.id,
      cotation: { $in: ['0', '0.33'] },
      actionGenerated: null,
    });

    if (!ecarts.length) {
      return res.json({ message: 'Aucun nouvel écart à transformer en action', created: 0, data: [] });
    }

    const refs = await DiagnosticReferentiel.find({ code: { $in: diag.normesActivees } });
    const refMap = new Map(refs.map((r) => [r.code, r]));

    const created = [];
    for (const r of ecarts) {
      const ref = refMap.get(r.referentiel);
      const q = ref?.questions?.[r.questionIdx];
      if (!q) continue;
      const tag = ref.label.replace(/\s/g, '');
      const description = `[Diag][${tag} § ${q.art}] ${q.q}` + (r.observation ? ` — ${r.observation}` : '');
      const priorite = r.cotation === '0' ? 'Haute' : 'Moyenne';

      const action = await Action.create({
        description,
        responsable: diag.evaluateur,
        priorite,
        sourceModule: 'diagnostic',
        sourceRef: diag._id,
        sourceLabel: `${diag.reference} · ${ref.label}`,
      });
      r.actionGenerated = action._id;
      await r.save();
      created.push(action);
    }

    diag.actionsGenerated = (diag.actionsGenerated || 0) + created.length;
    await diag.save();

    res.json({ message: `${created.length} action(s) créée(s)`, created: created.length, data: created });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT EXCEL
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/diagnostic/:id/export
router.get('/:id/export', verifyToken, verifyPermission('diagnostic', 'exporter'), validateObjectId, async (req, res, next) => {
  try {
    const diag = await Diagnostic.findById(req.params.id).populate(POPULATE);
    if (!diag) return res.status(404).json({ message: 'Diagnostic introuvable' });
    const refs = await DiagnosticReferentiel.find({ code: { $in: diag.normesActivees } });
    const reponses = await DiagnosticReponse.find({ diagnostic: req.params.id });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Faytek Starter';

    // Onglet synthèse
    const synth = wb.addWorksheet('Synthèse');
    synth.addRow(['Référence', diag.reference]);
    synth.addRow(['Organisme', diag.organisme]);
    synth.addRow(['Périmètre', diag.perimetre || '']);
    synth.addRow(['Évaluateur', `${diag.evaluateur?.prenom || ''} ${diag.evaluateur?.nom || ''}`]);
    synth.addRow(['Date', diag.date ? new Date(diag.date).toLocaleDateString('fr-FR') : '']);
    synth.addRow(['Statut', diag.status]);
    synth.addRow([]);
    synth.addRow(['Score global', diag.scoreGlobal == null ? '—' : (diag.scoreGlobal * 100).toFixed(1) + '%']);
    synth.addRow([]);
    synth.addRow(['Norme', 'Score', 'Évaluées', 'NC', 'À améliorer', 'Acceptable', 'Conforme', 'NA']);
    diag.scoresParNorme.forEach((s) => {
      synth.addRow([
        s.code,
        s.pct == null ? '—' : (s.pct * 100).toFixed(1) + '%',
        `${s.answered}/${s.total}`,
        s.nc, s.ai, s.acc, s.ok, s.na,
      ]);
    });

    // Un onglet par norme
    refs.forEach((ref) => {
      const ws = wb.addWorksheet(ref.label);
      ws.addRow(['#', 'Chapitre', 'Article', 'Question', 'Cotation', 'Observation']);
      ref.questions.forEach((q, i) => {
        const r = reponses.find((x) => x.referentiel === ref.code && x.questionIdx === i);
        ws.addRow([i + 1, q.chap, q.art, q.q, r?.cotation || '', r?.observation || '']);
      });
      ws.columns.forEach((c, i) => { c.width = [6, 30, 40, 60, 12, 40][i] || 20; });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${diag.reference}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

module.exports = router;
