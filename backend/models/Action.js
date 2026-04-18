const mongoose = require('mongoose');

const etatSubSchema = new mongoose.Schema(
  {
    etat: {
      type: String,
      enum: ['Créée', 'Faite', 'Non Faite', 'Validée', 'Rejetée'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const commentSubSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const reportSubSchema = new mongoose.Schema(
  {
    motif: { type: String, trim: true },
    ancienneDate: { type: Date },
    nouvelleDate: { type: Date },
    dateDemande: { type: Date, default: Date.now },
    etat: { type: String, enum: ['En attente', 'Accepté', 'Refusé'], default: 'En attente' },
    traitePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const actionSchema = new mongoose.Schema(
  {
    numero: { type: String, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responsableValidation: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    instance: { type: mongoose.Schema.Types.ObjectId, ref: 'Instance' },
    dateDeb: { type: Date },
    dateFin: { type: Date },
    firstDateFin: { type: Date },
    priorite: { type: String, enum: ['Haute', 'Moyenne', 'Basse'], default: 'Basse' },
    etat: { type: [etatSubSchema], default: () => [{ etat: 'Créée' }] },
    comments: { type: [commentSubSchema], default: [] },
    demandeReport: { type: [reportSubSchema], default: [] },
    nbReport: { type: Number, default: 0 },

    // ─── Provenance : d'où vient l'action ────────────────────────────────
    sourceModule: {
      type: String,
      enum: ['nc', 'rc', 'diagnostic', 'standalone'],
      default: 'standalone',
      index: true,
    },
    sourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'sourceModel',
      default: null,
    },
    sourceModel: {
      type: String,
      enum: ['NonConformite', 'Reclamation', 'Diagnostic', null],
      default: null,
    },
    sourceLabel: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Génération auto du numero : ACT-YYYY-XXXX
// Mongoose 9 : les hooks async ne reçoivent plus `next` — signature async-only.
actionSchema.pre('save', async function () {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      numero: { $regex: `^ACT-${year}-` },
    });
    this.numero = `ACT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.isNew && this.dateFin && !this.firstDateFin) {
    this.firstDateFin = this.dateFin;
  }
});

// Maintient sourceModel cohérent avec sourceModule
actionSchema.pre('save', function () {
  if (this.sourceModule === 'nc') this.sourceModel = 'NonConformite';
  else if (this.sourceModule === 'rc') this.sourceModel = 'Reclamation';
  else if (this.sourceModule === 'diagnostic') this.sourceModel = 'Diagnostic';
  else this.sourceModel = null;
});

module.exports = mongoose.model('Action', actionSchema);
