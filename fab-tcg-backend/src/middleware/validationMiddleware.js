/**
 * Input Validation Middleware
 * 
 * Provides validation rules for API endpoints using express-validator.
 * Centralizes input validation for security and consistency.
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validation rules for user registration
 */
const registerRules = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una letra y un número'),
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos')
        .trim()
];

/**
 * Validation rules for user login
 */
const loginRules = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

/**
 * Validation rules for deck creation/update
 */
const deckRules = [
    body('name')
        .isLength({ min: 1, max: 100 })
        .withMessage('El nombre del mazo debe tener entre 1 y 100 caracteres')
        .trim()
        .escape(),
    body('format')
        .isIn(['Classic Constructed', 'Silver Age', 'Blitz', 'Draft', 'Sealed'])
        .withMessage('Formato no válido')
];

/**
 * Validation rules for comments
 */
const commentRules = [
    body('content')
        .isLength({ min: 1, max: 2000 })
        .withMessage('El comentario debe tener entre 1 y 2000 caracteres')
        .trim()
];

/**
 * Validation for UUID parameters
 */
const uuidParam = (paramName) => [
    param(paramName)
        .isUUID()
        .withMessage(`${paramName} debe ser un UUID válido`)
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    deckRules,
    commentRules,
    uuidParam
};
