const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    profil: { type: mongoose.Schema.Types.ObjectId, ref: 'Profil' },
    modules: { type: [String], default: ['default'] },
    img: { type: String },
    telephone: { type: String, trim: true },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
