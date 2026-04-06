require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Profil = require('../models/Profil');

const profils = [
  {
    libelle: 'Admin',
    isDefault: true,
    permissions: {
      admin: true,
      user: { read: true, create: true, update: true, delete: true },
      profil: { read: true, create: true, update: true, delete: true },
    },
  },
  {
    libelle: 'Demandeur',
    isDefault: false,
    permissions: {
      user: { read: true, create: false, update: false, delete: false },
    },
  },
  {
    libelle: 'Validateur',
    isDefault: false,
    permissions: {
      user: { read: true, create: false, update: true, delete: false },
    },
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    for (const profilData of profils) {
      const exists = await Profil.findOne({ libelle: profilData.libelle });
      if (!exists) {
        await Profil.create(profilData);
        console.log(`✓ Profil "${profilData.libelle}" créé`);
      } else {
        console.log(`→ Profil "${profilData.libelle}" existe déjà`);
      }
    }

    console.log('Seed terminé');
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
