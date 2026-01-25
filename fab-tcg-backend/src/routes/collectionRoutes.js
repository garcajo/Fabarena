
const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const authenticateUser = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

router.get('/', collectionController.getCollection);
router.post('/add', collectionController.addCard);
router.post('/remove', collectionController.removeCard);

module.exports = router;
