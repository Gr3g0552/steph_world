const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

// Sanitize input to prevent XSS
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Enhanced rate limiting for different endpoints
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Custom rate limiter for authentication that bypasses rate limiting for admin emails
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increased from 5 to 10 for regular users
    skip: async (req) => {
        // Skip rate limiting for admin emails
        const email = req.body?.email?.toLowerCase()?.trim();
        if (email) {
            try {
                // Try exact match first
                let user = await db.promise.get(
                    'SELECT role FROM users WHERE email = ?',
                    [email]
                );
                
                // If not found and email contains dots, try without dots (Gmail normalization)
                if (!user && email.includes('.')) {
                    const emailWithoutDots = email.replace(/\./g, '');
                    user = await db.promise.get(
                        'SELECT role FROM users WHERE REPLACE(email, ".", "") = ?',
                        [emailWithoutDots]
                    );
                }
                
                // Skip rate limiting for admin accounts
                if (user && user.role === 'admin') {
                    return true; // Skip rate limiting
                }
            } catch (error) {
                console.error('Error checking admin status for rate limiting:', error);
                // On error, don't skip (apply rate limiting)
            }
        }
        return false; // Don't skip (apply rate limiting)
    },
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware to check if user is admin and bypass rate limiting
const checkAdminBypass = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const jwt = require('jsonwebtoken');
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.decode(token);
                if (decoded && decoded.role === 'admin') {
                    // Set flag to bypass rate limiting
                    req.skipRateLimit = true;
                    // Also set a property to identify admin requests
                    req.isAdmin = true;
                }
            }
        } catch (error) {
            // If decode fails, continue normally
        }
    }
    next();
};

// Custom rate limiter that skips authenticated admin users
// Uses JWT payload to check role synchronously (role is included in JWT token)
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Very high limit for regular users
    // Use custom key generator to separate admin users
    keyGenerator: (req) => {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                if (token) {
                    const decoded = jwt.decode(token);
                    if (decoded && decoded.role === 'admin') {
                        // Admin users get a special key with unlimited access
                        return `admin-${decoded.userId}-unlimited`;
                    }
                }
            } catch (error) {
                // Fall through to default
            }
        }
        // Regular users use IP-based key
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
    skip: (req) => {
        // Skip rate limiting if admin bypass flag is set
        if (req.skipRateLimit === true || req.isAdmin === true) {
            return true;
        }
        
        // Also check JWT directly as fallback
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                if (token) {
                    const decoded = jwt.decode(token);
                    if (decoded && decoded.role === 'admin') {
                        return true;
                    }
                }
            } catch (error) {
                // Continue with rate limiting
            }
        }
        return false;
    },
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    // Use a custom store that handles admin keys specially
    store: new (require('express-rate-limit').MemoryStore)(),
});
const uploadLimiter = createRateLimiter(60 * 60 * 1000, 20, 'Too many uploads, please try again later');
const commentLimiter = createRateLimiter(15 * 60 * 1000, 30, 'Too many comments, please try again later');

// Validation middleware
const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Sanitize request body
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeInput(req.body[key]);
            }
        });
    }
    next();
};

// Validate file upload
const validateFile = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const allowedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type' });
    }

    // Check file size (200MB max)
    const maxSize = 200 * 1024 * 1024;
    if (req.file.size > maxSize) {
        return res.status(400).json({ error: 'File too large. Maximum size is 200MB' });
    }

    next();
};

// SQL injection prevention - validate IDs
const validateId = (req, res, next) => {
    const idParams = ['id', 'userId', 'postId', 'categoryId', 'subcategoryId', 'commentId'];
    
    idParams.forEach(param => {
        if (req.params[param]) {
            const id = parseInt(req.params[param]);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: `Invalid ${param}` });
            }
            req.params[param] = id;
        }
    });

    next();
};

module.exports = {
    sanitizeInput,
    sanitizeBody,
    validateInput,
    validateFile,
    validateId,
    strictLimiter,
    authLimiter,
    uploadLimiter,
    commentLimiter,
    checkAdminBypass,
};

