const mongoose = require('mongoose');

const instanceSchema = new mongoose.Schema(
  {
    numero: { type: String, unique: true, index: true },
    libelle: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lieu: { type: String, trim: true, default: '' },
    // type : Shared (partagée) ou Perso (liée à un user)
    type: {
      valeur: { type: String, enum: ['Shared', 'Perso'], default: 'Shared' },
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Génération auto du numero : PA-YYYY-XXXX
// Mongoose 9 : les hooks async ne reçoivent plus `next` — signature async-only.
instanceSchema.pre('save', async function () {
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      numero: { $regex: `^PA-${year}-` },
    });
    this.numero = `PA-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Instance', instanceSchema);
