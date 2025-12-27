const { body, validationResult } = require('express-validator');

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

// Sanitize input to prevent XSS (but preserve URLs and common characters)
const sanitizeInput = (str, isUrl = false) => {
    if (typeof str !== 'string') return str;
    
    // First decode any already encoded entities to prevent double-encoding
    str = decodeHtmlEntities(str);
    
    // If it's a URL, don't encode slashes or common URL characters
    if (isUrl) {
        // Only sanitize potentially dangerous characters, but keep URL structure
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
    
    // For regular text, only sanitize dangerous HTML tags, but preserve quotes and slashes
    // This prevents XSS while allowing normal text with quotes and slashes
    // Note: We don't encode quotes and slashes in regular text to avoid HTML interpretation issues
    // React will handle escaping when rendering
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
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

// Sanitize request body (but preserve URLs and common text characters)
const sanitizeBody = (req, res, next) => {
    // Skip sanitization for multipart/form-data requests (file uploads)
    // Multer needs to parse these requests first
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        return next();
    }
    
    if (req.body) {
        // Fields that should be treated as URLs and not have slashes encoded
        const urlFields = ['profile_image', 'background_images', 'file_path', 'imageUrl', 'image_url'];
        // Fields that should NOT be sanitized (they will be handled by express-validator)
        const skipSanitizationFields = ['content']; // Comment content is handled by express-validator
        // Text fields that should allow quotes and slashes (title, description, username, etc.)
        const textFields = ['title', 'description', 'username', 'name', 'slug'];
        
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
                // Check if this is a text field that should preserve quotes and slashes
                const isTextField = textFields.includes(key);
                
                // Sanitize but preserve URL structure and text field characters
                if (isUrlField) {
                    req.body[key] = sanitizeInput(req.body[key], true);
                } else if (isTextField) {
                    // For text fields, only sanitize dangerous HTML tags, preserve quotes and slashes
                    req.body[key] = sanitizeInput(req.body[key], false);
                } else {
                    // For other fields, use standard sanitization
                    req.body[key] = sanitizeInput(req.body[key], false);
                }
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
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // Videos
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-ms-wmv',
        // Audio
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/x-ms-wma', 'audio/webm'
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

