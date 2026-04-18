const mongoose = require('mongoose');

const diagnosticReponseSchema = new mongoose.Schema(
  {
    diagnostic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Diagnostic',
      required: true,
      index: true,
    },
    referentiel: {
      type: String,
      enum: ['iso9001', 'iso14001', 'iso45001'],
      required: true,
    },
    questionIdx: { type: Number, required: true, min: 0 },

    // '0' / '0.33' / '0.66' / '1' / 'NA'
    cotation: {
      type: String,
      enum: ['0', '0.33', '0.66', '1', 'NA'],
      required: true,
    },
    observation: { type: String, trim: true, default: '' },

    // Action générée dans le module PA (si elle existe)
    actionGenerated: { type: mongoose.Schema.Types.ObjectId, ref: 'Action', default: null },
  },
  { timestamps: true }
);

// Une seule réponse par (campagne, norme, question)
diagnosticReponseSchema.index(
  { diagnostic: 1, referentiel: 1, questionIdx: 1 },
  { unique: true }
);

module.exports = mongoose.model('DiagnosticReponse', diagnosticReponseSchema);
