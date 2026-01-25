const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');

const commentController = require('../controllers/commentController');

// Public / Optional Auth Routes (View Decks)
router.get('/', optionalAuthMiddleware, deckController.getDecks);
router.get('/:id', optionalAuthMiddleware, deckController.getDeckById);
router.get('/:deckId/comments', optionalAuthMiddleware, commentController.getComments);

// Protected Routes (Create, Edit, Delete)
router.post('/', authMiddleware, deckController.createDeck);
router.put('/:id', authMiddleware, deckController.updateDeck);
router.delete('/:id', authMiddleware, deckController.deleteDeck);
router.post('/:deckId/comments', authMiddleware, commentController.createComment);

// Like Routes
router.get('/:id/likes', optionalAuthMiddleware, deckController.getLikeStatus);
router.post('/:id/like', authMiddleware, deckController.toggleLike);

module.exports = router;
