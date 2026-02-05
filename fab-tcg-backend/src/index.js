/**
 * FAB Arena Backend Server
 * 
 * Security Features:
 * - Helmet: Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - CORS: Restricted to allowed origins
 * - Rate Limiting: Protection against brute force and DoS attacks
 * - JWT Authentication: Via Supabase
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const cardRoutes = require('./routes/cardRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

/**
 * Helmet - Security Headers
 * Adds various HTTP headers for security (CSP, HSTS, X-Frame-Options, etc.)
 */
app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in dev for easier debugging
    crossOriginEmbedderPolicy: false // Allow embedding images from external sources
}));

/**
 * CORS Configuration
 * Restricts which origins can access the API
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        /\.vercel\.app$/,
        process.env.FRONTEND_URL
    ].filter(Boolean);

// In development, also allow local network access for mobile testing
if (!isProduction) {
    allowedOrigins.push(/^http:\/\/192\.168\.\d+\.\d+:\d+$/);
    allowedOrigins.push(/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/);
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check against allowed origins
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

/**
 * Rate Limiting - General API
 * Prevents abuse and DoS attacks
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // Limit per IP: 100 in prod, 1000 in dev
    message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde.' },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate Limiting - Authentication (stricter)
 * Prevents brute force attacks on login/register
 */
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isProduction ? 5 : 100, // 5 attempts per hour in prod, 100 in dev
    message: { error: 'Demasiados intentos de autenticación, intenta de nuevo en 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// =============================================================================
// BODY PARSING
// =============================================================================

app.use(express.json({ limit: '10mb' })); // Limit body size to prevent large payload attacks

// =============================================================================
// REQUEST LOGGING (only in development)
// =============================================================================

if (!isProduction) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// =============================================================================
// ROUTES
// =============================================================================

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
        environment: isProduction ? 'production' : 'development',
        timestamp: new Date().toISOString()
    });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    // Log error details server-side
    console.error('Server Error:', {
        message: err.message,
        stack: isProduction ? undefined : err.stack,
        path: req.path,
        method: req.method
    });

    // Send safe error response to client
    res.status(err.status || 500).json({
        error: 'Error interno del servidor',
        message: isProduction ? undefined : err.message
    });
});

// =============================================================================
// SERVER START
// =============================================================================

// Initialize Cron Jobs
const { initCronJobs } = require('./jobs/cron');
initCronJobs();

app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════');
    console.log(`🚀 FAB Arena Backend v1.0`);
    console.log(`📍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🔗 API: http://0.0.0.0:${PORT}/api`);
    console.log(`🔒 Security: Helmet + CORS + Rate Limiting enabled`);
    console.log('═══════════════════════════════════════════');
});
