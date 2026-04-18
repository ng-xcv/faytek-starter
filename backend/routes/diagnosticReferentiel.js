const express = require('express');
const router = express.Router();
const DiagnosticReferentiel = require('../models/DiagnosticReferentiel');
const { verifyToken, verifyPermission } = require('../middleware/verifyToken');

// GET /api/diagnostic-referentiel — liste complète des 3 normes + leurs questions.
// Catalogue immuable côté UI : permission `voir` suffit.
router.get('/', verifyToken, verifyPermission('diagnostic', 'voir'), async (req, res, next) => {
  try {
    const items = await DiagnosticReferentiel.find().sort({ code: 1 });
    res.json({ data: items });
  } catch (err) { next(err); }
});

module.exports = router;
