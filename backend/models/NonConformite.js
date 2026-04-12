const mongoose = require('mongoose');

const nonConformiteSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true },
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Processus', 'Produit', 'Service', 'Sécurité', 'Autre'],
      required: true,
    },
    gravite: {
      type: String,
      enum: ['Mineure', 'Majeure', 'Critique'],
      required: true,
    },
    statut: {
      type: String,
      enum: ['Ouverte', 'En cours', 'En attente', 'Clôturée'],
      default: 'Ouverte',
    },
    dateDetection: { type: Date, required: true },
    dateEcheance: { type: Date },
    lieuDetection: { type: String, trim: true },
    detectePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionCorrective: { type: String, trim: true },
    coutEstime: { type: Number, min: 0 },
    clotureLe: { type: Date },
    clotureNote: { type: String, trim: true },
  },
  { timestamps: true }
);

// Index pour les filtres courants
nonConformiteSchema.index({ statut: 1 });
nonConformiteSchema.index({ gravite: 1 });
nonConformiteSchema.index({ dateDetection: -1 });
nonConformiteSchema.index({ responsable: 1 });

// Auto-référence NC-YYYY-NNN
nonConformiteSchema.pre('save', async function () {
  if (this.reference) return;
  const year = new Date().getFullYear();
  const count = await mongoose.model('NonConformite').countDocuments({
    reference: { $regex: `^NC-${year}-` },
  });
  this.reference = `NC-${year}-${String(count + 1).padStart(3, '0')}`;
});

module.exports = mongoose.model('NonConformite', nonConformiteSchema);
