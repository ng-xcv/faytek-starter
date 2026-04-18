const mongoose = require('mongoose');

// ─── Sous-schémas ─────────────────────────────────────────────────────────

// Critère d'évaluation de l'efficacité d'une action corrective
const evaluationCriterionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    score: { type: Number, min: 0, max: 100, default: null },
    comment: { type: String, trim: true, default: '' },
  },
  { _id: true, timestamps: false }
);

const correctiveActionSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['planifiee', 'en_cours', 'realisee'],
      default: 'planifiee',
    },
    evaluationCriteria: { type: [evaluationCriterionSchema], default: [] },
    effectivenessScore: { type: Number, min: 0, max: 100, default: null },
  },
  { _id: true, timestamps: true }
);

// Analyse des causes : 5M / Ishikawa / 5Y.
// `data` est libre pour accommoder la structure propre à chaque méthode :
//  - 5M / Ishikawa : { 'Main d\'œuvre': [...], 'Matière': [...], 'Méthode': [...], 'Machine': [...], 'Milieu': [...] }
//  - 5Y : { problem: '...', whys: ['pourquoi 1', ..., 'pourquoi 5'] }
const causeAnalysisSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['5M', 'Ishikawa', '5Y'], required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    conclusion: { type: String, trim: true, default: '' },
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Schéma principal ─────────────────────────────────────────────────────

const nonConformiteSchema = new mongoose.Schema(
  {
    // Identification
    reference: { type: String, unique: true, index: true },

    // Étape 1 : Déclaration
    description: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] },
    consequences: { type: String, required: true, trim: true },
    productOrService: { type: String, enum: ['product', 'service'], required: true },
    productServiceName: { type: String, required: true, trim: true },
    productServiceDescription: { type: String, trim: true, default: '' },
    declaredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    declaredAt: { type: Date, default: Date.now },

    // Étape 2 : Dispatch
    processes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Process' }],
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dispatchedAt: { type: Date },
    dispatchNote: { type: String, trim: true, default: '' },

    // Étape 3 : Traitement
    immediateCorrections: [
      {
        description: { type: String, required: true, trim: true },
        appliedAt: { type: Date, default: Date.now },
        appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    causeAnalysis: { type: causeAnalysisSchema, default: null },
    correctiveActions: { type: [correctiveActionSchema], default: [] },
    similarNCDetected: { type: Boolean, default: false },
    similarNCReferences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NonConformite' }],
    similarNCNote: { type: String, trim: true, default: '' },
    systemModificationRequired: { type: Boolean, default: false },
    systemModificationJustification: { type: String, trim: true, default: '' },
    treatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    treatedAt: { type: Date },

    // Étape 4 : Clôture
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
    closureComment: { type: String, trim: true, default: '' },

    // Workflow + SLA
    status: {
      type: String,
      enum: ['submitted', 'dispatched', 'in_treatment', 'pending_closure', 'closed'],
      default: 'submitted',
      index: true,
    },
    dueDispatchAt: { type: Date },
    dueTreatmentAt: { type: Date },
    dueClosureAt: { type: Date },
  },
  { timestamps: true }
);

// Index composés pour les filtres courants
nonConformiteSchema.index({ status: 1, createdAt: -1 });
nonConformiteSchema.index({ processes: 1 });
nonConformiteSchema.index({ declaredBy: 1 });

// Virtuel : statut SLA courant calculé selon l'étape active
nonConformiteSchema.virtual('slaStatus').get(function () {
  if (this.status === 'closed') return 'on_time';
  let due = null;
  if (this.status === 'submitted') due = this.dueDispatchAt;
  else if (this.status === 'dispatched' || this.status === 'in_treatment') due = this.dueTreatmentAt;
  else if (this.status === 'pending_closure') due = this.dueClosureAt;
  if (!due) return 'on_time';
  const diff = new Date(due).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 12 * 3600 * 1000) return 'at_risk';
  return 'on_time';
});

nonConformiteSchema.set('toJSON', { virtuals: true });
nonConformiteSchema.set('toObject', { virtuals: true });

// Génération automatique de la référence NC-YYYY-####
nonConformiteSchema.pre('save', async function () {
  if (this.reference) return;
  const year = new Date().getFullYear();
  const count = await mongoose.model('NonConformite').countDocuments({
    reference: { $regex: `^NC-${year}-` },
  });
  this.reference = `NC-${year}-${String(count + 1).padStart(4, '0')}`;
});

module.exports = mongoose.model('NonConformite', nonConformiteSchema);
