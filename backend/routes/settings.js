const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer');
const Settings = require('../models/Settings');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinary');

// ─── MULTER (memoryStorage pour Cloudinary) ─────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i;
  if (allowed.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── VALIDATION ─────────────────────────────────────────────────────────────
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

const updateSchema = Joi.object({
  companyName: Joi.string().allow(''),
  companyLabel: Joi.string().allow(''),
  slogan: Joi.string().allow(''),
  registreCommerce: Joi.string().allow(''),
  ninea: Joi.string().allow(''),
  phone1: Joi.string().allow(''),
  phone2: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  address: Joi.string().allow(''),
  website: Joi.string().uri().allow(''),
  primaryColor: Joi.string().pattern(hexColorRegex).message('Couleur primaire invalide (format #RRGGBB)'),
  secondaryColor: Joi.string().pattern(hexColorRegex).message('Couleur secondaire invalide (format #RRGGBB)'),
});

// ─── HELPER : récupérer ou créer le singleton ───────────────────────────────
async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

// ─── GET /api/settings (public pour charger le thème) ───────────────────────
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/settings (admin uniquement) ───────────────────────────────────
router.put(
  '/',
  verifyToken,
  verifyPermission('admin', 'gererParams'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { error } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const settings = await getSettings();
      const updateData = { ...req.body };

      // Upload logo vers Cloudinary
      if (req.files?.logo?.[0]) {
        // Supprimer l'ancien sur Cloudinary
        const oldPublicId = getPublicIdFromUrl(settings.logo);
        if (oldPublicId) await deleteFromCloudinary(oldPublicId);

        const result = await uploadToCloudinary(req.files.logo[0].buffer, {
          folder: 'settings',
          public_id: `logo_${Date.now()}`,
          resource_type: 'image',
        });
        updateData.logo = result.secure_url;
      }

      // Upload favicon vers Cloudinary
      if (req.files?.favicon?.[0]) {
        const oldPublicId = getPublicIdFromUrl(settings.favicon);
        if (oldPublicId) await deleteFromCloudinary(oldPublicId);

        const result = await uploadToCloudinary(req.files.favicon[0].buffer, {
          folder: 'settings',
          public_id: `favicon_${Date.now()}`,
          resource_type: 'image',
        });
        updateData.favicon = result.secure_url;
      }

      Object.assign(settings, updateData);
      await settings.save();

      res.json({ message: 'Paramètres mis à jour avec succès', settings });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
