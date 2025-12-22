const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Verify JWT token
const authenticateToken = (req, res, next) => {
    // Skip authentication for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Set CORS headers even on error
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            // Set CORS headers even on error
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Verify user still exists and is approved
        const user = await db.promise.get(
            'SELECT id, email, username, role, is_approved FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user || (!user.is_approved && user.role !== 'admin')) {
            // Set CORS headers even on error
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            return res.status(403).json({ error: 'User not authorized' });
        }

        req.user = user;
        next();
    });
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin };

