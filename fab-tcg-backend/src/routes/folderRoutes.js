/**
 * Folder Routes - API endpoints for deck folder management
 */
const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const authMiddleware = require('../middleware/authMiddleware');

// All folder routes require authentication
router.use(authMiddleware);

// GET /api/folders - Get all folders for user
router.get('/', folderController.getFolders);

// POST /api/folders - Create a new folder
router.post('/', folderController.createFolder);

// PUT /api/folders/:id - Update a folder
router.put('/:id', folderController.updateFolder);

// DELETE /api/folders/:id - Delete a folder
router.delete('/:id', folderController.deleteFolder);

// PUT /api/folders/assign/:deckId - Assign deck to folder
router.put('/assign/:deckId', folderController.assignDeckToFolder);

module.exports = router;
