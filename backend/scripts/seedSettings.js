/**
 * Script de seed : crée les paramètres par défaut de l'entreprise.
 * Usage : node scripts/seedSettings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../models/Settings');

const DEFAULT_SETTINGS = {
  companyName: 'Faytek Solution',
  companyLabel: 'Faytek Solution SARL',
  slogan: 'L\'innovation au service de votre entreprise',
  registreCommerce: '',
  ninea: '',
  phone1: '+221 77 000 00 00',
  phone2: '',
  email: 'contact@faytek.com',
  address: 'Dakar, Sénégal',
  primaryColor: '#1B4B8A',
  secondaryColor: '#7AB929',
  logo: '',
  favicon: '',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');

    const existing = await Settings.findOne();
    if (existing) {
      console.log('Paramètres déjà existants, aucune action.');
    } else {
      await Settings.create(DEFAULT_SETTINGS);
      console.log('Paramètres par défaut créés avec succès.');
    }
  } catch (err) {
    console.error('Erreur :', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
