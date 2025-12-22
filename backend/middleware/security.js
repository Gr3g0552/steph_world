const { body, validationResult } = require('express-validator');

// Sanitize input to prevent XSS (but preserve URLs)
const sanitizeInput = (str, isUrl = false) => {
    if (typeof str !== 'string') return str;
    
    // If it's a URL, don't encode slashes
    if (isUrl) {
        // Only sanitize potentially dangerous characters, but keep URL structure
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
    
    // For regular text, sanitize everything including slashes
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Decode HTML entities (for fixing already encoded URLs)
const decodeHtmlEntities = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&#x2F;/g, '/')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
};

// Check if a string looks like a URL
const isUrl = (str) => {
    if (typeof str !== 'string') return false;
    return str.startsWith('http://') || 
           str.startsWith('https://') || 
           str.startsWith('/uploads/') ||
           str.startsWith('data:') ||
           /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(str); // Protocol-like pattern
};

// Validation middleware
const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Log validation errors for debugging
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ 
            error: 'Validation failed',
            errors: errors.array() 
        });
    }
    next();
};

// Sanitize request body (but preserve URLs)
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        // Fields that should be treated as URLs and not have slashes encoded
        const urlFields = ['profile_image', 'background_images', 'file_path', 'imageUrl', 'image_url'];
        // Fields that should NOT be sanitized (they will be handled by express-validator)
        const skipSanitizationFields = ['content']; // Comment content is handled by express-validator
        
        Object.keys(req.body).forEach(key => {
            // Skip sanitization for specific fields
            if (skipSanitizationFields.includes(key)) {
                return; // Skip this field, let express-validator handle it
            }
            
            if (typeof req.body[key] === 'string') {
                // First, decode any already encoded entities (fix for existing issues)
                req.body[key] = decodeHtmlEntities(req.body[key]);
                
                // Check if this field should be treated as a URL
                const isUrlField = urlFields.includes(key) || isUrl(req.body[key]);
                
                // Sanitize but preserve URL structure
                req.body[key] = sanitizeInput(req.body[key], isUrlField);
            } else if (Array.isArray(req.body[key]) && key === 'background_images') {
                // Handle background_images array
                req.body[key] = req.body[key].map(item => {
                    if (typeof item === 'string') {
                        const decoded = decodeHtmlEntities(item);
                        return sanitizeInput(decoded, true);
                    }
                    return item;
                });
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
    decodeHtmlEntities,
};

