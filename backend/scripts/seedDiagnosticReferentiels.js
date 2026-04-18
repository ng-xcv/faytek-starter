/**
 * Seed des 3 référentiels ISO du module Diagnostic.
 * Source : scripts/data/diagnostic-questions.json (copie de l'app HTML originale).
 * Usage : cd backend && node scripts/seedDiagnosticReferentiels.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const DiagnosticReferentiel = require('../models/DiagnosticReferentiel');

const QUESTIONS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'diagnostic-questions.json'), 'utf-8')
);

const META = {
  iso9001: {
    label: 'ISO 9001',
    titre: 'Qualité',
    full: 'ISO 9001 : 2015 — Management de la qualité',
  },
  iso14001: {
    label: 'ISO 14001',
    titre: 'Environnement',
    full: 'ISO 14001 : 2015 — Management environnemental',
  },
  iso45001: {
    label: 'ISO 45001',
    titre: 'Santé & Sécurité',
    full: 'ISO 45001 : 2018 — Santé & sécurité au travail',
  },
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');

    for (const [code, meta] of Object.entries(META)) {
      const items = (QUESTIONS[code] || []).map((q, i) => ({
        chap: q.chap,
        art: q.art,
        q: q.q,
        ordre: i,
      }));
      const payload = { code, ...meta, questions: items };
      const existing = await DiagnosticReferentiel.findOne({ code });
      if (existing) {
        existing.set(payload);
        await existing.save();
        console.log(`  ↻ ${code} mis à jour (${items.length} questions)`);
      } else {
        await DiagnosticReferentiel.create(payload);
        console.log(`  ✅ ${code} créé (${items.length} questions)`);
      }
    }

    console.log('\nSeed Diagnostic terminé');
  } catch (err) {
    console.error('Erreur seed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
