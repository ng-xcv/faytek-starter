const mongoose = require('mongoose');

// Score figé / cache : recalculé à chaque modification de réponse.
const scoreNormeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    pct: { type: Number, default: null },
    answered: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    nc: { type: Number, default: 0 },
    ai: { type: Number, default: 0 },
    acc: { type: Number, default: 0 },
    ok: { type: Number, default: 0 },
    na: { type: Number, default: 0 },
  },
  { _id: false }
);

const scoreChapitreSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    chap: { type: String, required: true },
    pct: { type: Number, default: null },
    answered: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const diagnosticSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },

    // Identification de la campagne
    organisme: { type: String, required: true, trim: true },
    perimetre: { type: String, trim: true, default: '' },
    evaluateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },

    // Normes activées (codes ISO)
    normesActivees: {
      type: [{ type: String, enum: ['iso9001', 'iso14001', 'iso45001'] }],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    // Workflow
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Cache scores (mis à jour à chaque PUT /answer)
    scoreGlobal: { type: Number, default: null },
    scoresParNorme: { type: [scoreNormeSchema], default: [] },
    scoresParChapitre: { type: [scoreChapitreSchema], default: [] },

    // Compteur d'actions PA déjà générées (pour l'idempotence du bouton)
    actionsGenerated: { type: Number, default: 0 },
  },
  { timestamps: true }
);

diagnosticSchema.index({ evaluateur: 1, createdAt: -1 });
diagnosticSchema.index({ status: 1, createdAt: -1 });

// Référence auto : DIAG-YYYYMM-####
diagnosticSchema.pre('save', async function () {
  if (this.reference) return;
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = await mongoose.model('Diagnostic').countDocuments({
    reference: { $regex: `^DIAG-${ym}-` },
  });
  this.reference = `DIAG-${ym}-${String(count + 1).padStart(3, '0')}`;
});

module.exports = mongoose.model('Diagnostic', diagnosticSchema);
