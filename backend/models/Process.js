const mongoose = require('mongoose');

// Processus concerné par une ou plusieurs non-conformités.
// Chaque processus a un pilote (owner) responsable du traitement des NC dispatchées.
const processSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// `unique: true` crée déjà l'index sur `code`, pas besoin de le redéclarer ici.
processSchema.index({ actif: 1 });

module.exports = mongoose.model('Process', processSchema);
