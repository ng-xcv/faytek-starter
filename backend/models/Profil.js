const mongoose = require('mongoose');

const profilSchema = new mongoose.Schema(
  {
    libelle: { type: String, required: true, unique: true, trim: true },
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profil', profilSchema);
