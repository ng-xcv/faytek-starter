const mongoose = require('mongoose');

// Une question d'un référentiel ISO. L'index dans le tableau questions sert
// d'identifiant stable pour les réponses (DiagnosticReponse.questionIdx).
const questionSchema = new mongoose.Schema(
  {
    chap: { type: String, required: true, trim: true },
    art: { type: String, required: true, trim: true },
    q: { type: String, required: true, trim: true },
    ordre: { type: Number, required: true },
  },
  { _id: false }
);

const diagnosticReferentielSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: ['iso9001', 'iso14001', 'iso45001'],
      required: true,
      unique: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
    titre: { type: String, required: true, trim: true },
    full: { type: String, required: true, trim: true },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DiagnosticReferentiel', diagnosticReferentielSchema);
