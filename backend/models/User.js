const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false → le password n'est jamais renvoyé sauf demande explicite via .select('+password')
    password: { type: String, required: true, select: false },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    profil: { type: mongoose.Schema.Types.ObjectId, ref: 'Profil' },
    modules: { type: [String], default: ['default'] },
    img: { type: String },
    telephone: { type: String, trim: true },
    actif: { type: Boolean, default: true },
    // Refresh token courant (rotation : un seul token actif à la fois)
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

// ─── Hash automatique du mot de passe avant save ────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

// ─── Méthode d'instance pour comparer un mot de passe en clair au hash ─────
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
