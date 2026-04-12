/**
 * Script de seed : crée le compte admin initial.
 * Usage : node scripts/seedAdmin.js
 */
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const User = require("../models/User");
const Profil = require("../models/Profil");

const ADMIN = {
  email: "fayteksolution@gmail.com",
  password: "Faytek2026!",
  nom: "FAYE",
  prenom: "Ahmadou Ngary",
  modules: ["default"],
  actif: true,
  isAdmin: true,
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connecté");

    // Récupérer le profil Administrateur (créé via seedProfils.js)
    const adminProfil = await Profil.findOne({ nom: "Administrateur" });
    if (!adminProfil) {
      console.error(
        '❌ Profil "Administrateur" introuvable. Lancer d\'abord : node scripts/seedProfils.js',
      );
      return;
    }

    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      if (
        !existing.profil ||
        String(existing.profil) !== String(adminProfil._id)
      ) {
        existing.profil = adminProfil._id;
        await existing.save();
        console.log(`✅ Profil Administrateur lié à ${ADMIN.email}`);
      } else {
        console.log(
          "Compte déjà existant et lié au profil Administrateur, aucune action.",
        );
      }
    } else {
      await User.create({ ...ADMIN, profil: adminProfil._id });
      console.log(`✅ Compte créé : ${ADMIN.email} (profil Administrateur)`);
    }
  } catch (err) {
    console.error("Erreur :", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
