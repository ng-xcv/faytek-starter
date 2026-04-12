const mongoose = require('mongoose');
const { MODULES, ACTIONS } = require('../constants/permissions');

// Sous-schéma : un booléen par action
const modulePermSchema = new mongoose.Schema(
  ACTIONS.reduce((acc, action) => ({ ...acc, [action]: { type: Boolean, default: false } }), {}),
  { _id: false }
);

// Objet permissions : une clé par module
const permissionsShape = MODULES.reduce(
  (acc, mod) => ({
    ...acc,
    [mod]: { type: modulePermSchema, default: () => ({}) },
  }),
  {}
);

const profilSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: '' },
    isAdmin: { type: Boolean, default: false },
    actif: { type: Boolean, default: true },
    permissions: permissionsShape,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profil', profilSchema);
