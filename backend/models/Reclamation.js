const mongoose = require('mongoose');

// ─── Sous-schémas ─────────────────────────────────────────────────────────

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

const causeAnalysisSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['5M', 'Ishikawa', '5Y'], required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    conclusion: { type: String, trim: true, default: '' },
    analyzedAt: { type: Date, default: Date.now },
    analyzedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const clientResponseSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ['mail', 'call', 'sms', 'whatsapp', 'in_person'],
      required: true,
    },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
    attachments: { type: [String], default: [] },
  },
  { _id: true, timestamps: false }
);

const clientSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    telephone: { type: String, trim: true, default: '' },
    societe: { type: String, trim: true, default: '' },
    adresse: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const clientFeedbackSchema = new mongoose.Schema(
  {
    received: { type: Boolean, default: false },
    receivedAt: { type: Date },
    effective: { type: Boolean, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, trim: true, default: '' },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const satisfactionSurveySchema = new mongoose.Schema(
  {
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: { type: String, index: true, sparse: true },
    responded: { type: Boolean, default: false },
    respondedAt: { type: Date },
    scores: {
      traitement: { type: Number, min: 1, max: 5, default: null },
      delai: { type: Number, min: 1, max: 5, default: null },
      communication: { type: Number, min: 1, max: 5, default: null },
      resolution: { type: Number, min: 1, max: 5, default: null },
    },
    nps: { type: Number, min: 0, max: 10, default: null },
    comment: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// ─── Schéma principal ─────────────────────────────────────────────────────

const reclamationSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },

    // Étape 1 : Source & client
    source: {
      type: String,
      enum: ['employe', 'call', 'mail', 'sms', 'whatsapp'],
      required: true,
    },
    sourceDetail: { type: String, trim: true, default: '' },
    client: { type: clientSchema, required: true },
    objet: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    pieces: { type: [String], default: [] },
    priorite: {
      type: String,
      enum: ['basse', 'normale', 'haute', 'critique'],
      default: 'normale',
    },
    declaredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    declaredAt: { type: Date, default: Date.now },

    // Étape 2 : Dispatch
    processes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Process' }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dispatchedAt: { type: Date },
    dispatchNote: { type: String, trim: true, default: '' },

    // Étape 3 : Réponses au client (thread)
    clientResponses: { type: [clientResponseSchema], default: [] },

    // Étape 4 : Analyse des causes
    causeAnalysis: { type: causeAnalysisSchema, default: null },

    // Étape 5 : Plan d'action
    correctiveActions: { type: [correctiveActionSchema], default: [] },

    // Étape 6 : Retour client (efficacité)
    clientFeedback: { type: clientFeedbackSchema, default: () => ({}) },

    // Étape 7 : Clôture
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
    closureComment: { type: String, trim: true, default: '' },

    // Étape 8 : Enquête de satisfaction
    satisfactionSurvey: { type: satisfactionSurveySchema, default: () => ({}) },

    // Workflow + SLA
    status: {
      type: String,
      enum: [
        'submitted',
        'dispatched',
        'responded',
        'in_analysis',
        'action_plan',
        'pending_closure',
        'closed',
        'survey_sent',
        'survey_completed',
      ],
      default: 'submitted',
      index: true,
    },
    dueDispatchAt: { type: Date },
    dueResponseAt: { type: Date },
    dueTreatmentAt: { type: Date },
    dueClosureAt: { type: Date },
    dueSurveyAt: { type: Date },
  },
  { timestamps: true }
);

reclamationSchema.index({ status: 1, createdAt: -1 });
reclamationSchema.index({ processes: 1 });
reclamationSchema.index({ declaredBy: 1 });
reclamationSchema.index({ 'client.email': 1 });

// Virtuel : statut SLA selon l'étape active
reclamationSchema.virtual('slaStatus').get(function () {
  if (['closed', 'survey_completed'].includes(this.status)) return 'on_time';
  let due = null;
  if (this.status === 'submitted') due = this.dueDispatchAt;
  else if (this.status === 'dispatched') due = this.dueResponseAt || this.dueTreatmentAt;
  else if (['responded', 'in_analysis', 'action_plan'].includes(this.status)) due = this.dueTreatmentAt;
  else if (this.status === 'pending_closure') due = this.dueClosureAt;
  else if (this.status === 'survey_sent') due = this.dueSurveyAt;
  if (!due) return 'on_time';
  const diff = new Date(due).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 12 * 3600 * 1000) return 'at_risk';
  return 'on_time';
});

reclamationSchema.set('toJSON', { virtuals: true });
reclamationSchema.set('toObject', { virtuals: true });

// Génération automatique de la référence RC-YYYY-####
reclamationSchema.pre('save', async function () {
  if (this.reference) return;
  const year = new Date().getFullYear();
  const count = await mongoose.model('Reclamation').countDocuments({
    reference: { $regex: `^RC-${year}-` },
  });
  this.reference = `RC-${year}-${String(count + 1).padStart(4, '0')}`;
});

module.exports = mongoose.model('Reclamation', reclamationSchema);
