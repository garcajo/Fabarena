require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

console.log('-----------------------------------');
console.log('   SERVER RESTARTED - DEBUG ACTIVE ');
console.log('-----------------------------------');

// Middleware
app.use(cors()); // Enable CORS for all origins (can be restricted in production)
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/cards', cardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/decks', require('./routes/deckRoutes'));
app.use('/api/collection', require('./routes/collectionRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/folders', require('./routes/folderRoutes'));


// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'FAB TCG Backend is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API: http://0.0.0.0:${PORT}/api/cards`);
});
