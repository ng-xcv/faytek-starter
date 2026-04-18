/**
 * Script de seed : crée les profils système BuyFlow/Faytek par défaut.
 * Usage : cd backend && node scripts/seedProfils.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Profil = require('../models/Profil');

const SEED_DATA = [
  {
    nom: 'Admin',
    description: 'Accès total à toutes les fonctionnalités',
    isAdmin: true,
    actif: true,
  },
  {
    nom: 'Responsable Qualité',
    description: 'Gestion complète des non-conformités et processus',
    isAdmin: false,
    actif: true,
    permissions: {
      nc: { voir: true, creer: true, modifier: true, supprimer: true, valider: true, voirTout: true, exporter: true, voirTableauDeBord: true },
      rc: { voir: true, creer: true, modifier: true, supprimer: true, valider: true, voirTout: true, exporter: true, voirTableauDeBord: true },
      process: { voir: true, creer: true, modifier: true, supprimer: true },
      pa: { voir: true, creer: true, modifier: true, valider: true, voirTout: true, voirTableauDeBord: true },
      diagnostic: { voir: true, creer: true, modifier: true, supprimer: true, voirTout: true, exporter: true, voirTableauDeBord: true },
      admin: { gererParams: true },
    },
  },
  {
    nom: 'Pilote Processus',
    description: 'Traitement des non-conformités et réclamations affectées à ses processus',
    isAdmin: false,
    actif: true,
    permissions: {
      nc: { voir: true, modifier: true },
      rc: { voir: true, modifier: true },
      process: { voir: true },
      pa: { voir: true, creer: true, modifier: true },
      diagnostic: { voir: true },
    },
  },
  {
    nom: 'Déclarant',
    description: 'Déclare des non-conformités et réclamations, consulte ses propres fiches',
    isAdmin: false,
    actif: true,
    permissions: {
      nc: { voir: true, creer: true },
      rc: { voir: true, creer: true },
      process: { voir: true },
      pa: { voir: true },
      diagnostic: { voir: true, creer: true, modifier: true },
    },
  },
  {
    nom: 'Consultant',
    description: 'Consultation et export uniquement',
    isAdmin: false,
    actif: true,
    permissions: {
      nc: { voir: true, voirTout: true, exporter: true, voirTableauDeBord: true },
      rc: { voir: true, voirTout: true, exporter: true, voirTableauDeBord: true },
      process: { voir: true },
      pa: { voir: true, voirTout: true },
      diagnostic: { voir: true, voirTout: true, exporter: true, voirTableauDeBord: true },
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
