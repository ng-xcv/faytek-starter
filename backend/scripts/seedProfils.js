/**
 * Script de seed : crée les 3 profils par défaut.
 * Usage : cd backend && node scripts/seedProfils.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Profil = require('../models/Profil');

const SEED_DATA = [
  {
    nom: 'Administrateur',
    description: 'Accès total à toutes les fonctionnalités',
    isAdmin: true,
    actif: true,
  },
  {
    nom: 'Gestionnaire',
    description: 'Gestion complète des non-conformités',
    isAdmin: false,
    actif: true,
    permissions: {
      users: { voirListe: true, voir: true },
      profils: { voirListe: true, voir: true },
      nonConformites: { voirListe: true, voir: true, creer: true, modifier: true, supprimer: true, valider: true, exporter: true },
      settings: { voirListe: true, voir: true },
    },
  },
  {
    nom: 'Consultant',
    description: 'Consultation et export uniquement',
    isAdmin: false,
    actif: true,
    permissions: {
      users: { voirListe: true, voir: true },
      profils: { voirListe: true, voir: true },
      nonConformites: { voirListe: true, voir: true, exporter: true },
      settings: { voirListe: true, voir: true },
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');

    for (const data of SEED_DATA) {
      const exists = await Profil.findOne({ nom: data.nom });
      if (exists) {
        console.log(`  ⏭ Profil "${data.nom}" existe déjà`);
      } else {
        await Profil.create(data);
        console.log(`  ✅ Profil "${data.nom}" créé`);
      }
    }

    console.log('\nSeed terminé');
  } catch (err) {
    console.error('Erreur seed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
