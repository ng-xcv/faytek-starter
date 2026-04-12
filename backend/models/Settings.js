const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Identité visuelle
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    primaryColor: {
      type: String,
      default: '#1B4B8A',
      match: [/^#([0-9A-Fa-f]{6})$/, 'Couleur primaire invalide (format #RRGGBB)'],
    },
    secondaryColor: {
      type: String,
      default: '#7AB929',
      match: [/^#([0-9A-Fa-f]{6})$/, 'Couleur secondaire invalide (format #RRGGBB)'],
    },

    // Informations de l'entreprise
    companyName: { type: String, default: 'Faytek Solution', trim: true },
    companyLabel: { type: String, default: '', trim: true },
    slogan: { type: String, default: '', trim: true },

    // Informations légales
    registreCommerce: { type: String, default: '', trim: true },
    ninea: { type: String, default: '', trim: true },

    // Contact
    phone1: { type: String, default: '', trim: true },
    phone2: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
