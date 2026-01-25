const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

// Rutas de metadata (deben ir antes de /:id para evitar conflictos)
router.get('/metadata/classes', cardController.getClasses);
router.get('/metadata/sets', cardController.getSets);
router.get('/living-legend', cardController.getLivingLegendData);
router.get('/bans', cardController.getBannedCards);

// Rutas de cartas
router.post('/batch-lookup', cardController.getCardsByNames);
router.get('/', cardController.getAllCards);
router.get('/:id', cardController.getCardById);

module.exports = router;
