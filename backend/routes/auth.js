const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, validateInput } = require('../middleware/security');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('username').trim().isLength({ min: 3, max: 30 }),
    body('password').isLength({ min: 8 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, username, password } = req.body;

        // Check if user exists
        const existingUser = await db.promise.get(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user (pending approval)
        const result = await db.promise.run(
            `INSERT INTO users (email, username, password_hash, is_approved) 
             VALUES (?, ?, ?, 0)`,
            [email, username, passwordHash]
        );

        res.status(201).json({ 
            message: 'Registration successful. Waiting for admin approval.',
            userId: result.lastID 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', authLimiter, [
    body('email').isEmail(),
    body('password').notEmpty()
], validateInput, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { email, password } = req.body;
        // Normalize email manually (lowercase, trim) - don't use normalizeEmail() as it removes dots
        email = email.toLowerCase().trim();

        // Find user - try exact match first, then try without dots (Gmail normalization)
        let user = await db.promise.get(
            'SELECT id, email, username, password_hash, role, is_approved FROM users WHERE email = ?',
            [email]
        );
        
        // If not found and email contains dots, try without dots (Gmail treats dots as same)
        if (!user && email.includes('.')) {
            const emailWithoutDots = email.replace(/\./g, '');
            user = await db.promise.get(
                'SELECT id, email, username, password_hash, role, is_approved FROM users WHERE REPLACE(email, ".", "") = ?',
                [emailWithoutDots]
            );
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password first
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if approved (admin bypass)
        // SQLite stores booleans as integers (0 or 1)
        // Admin role bypasses approval check
        console.log('Login attempt - Role:', user.role, 'Is approved:', user.is_approved);
        if (user.role === 'admin') {
            console.log('Admin login - bypassing approval check');
            // Admin can always login
        } else {
            console.log('Non-admin login - checking approval');
            const isApproved = user.is_approved === 1 || user.is_approved === true || user.is_approved === '1';
            if (!isApproved) {
                console.log('Account not approved');
                return res.status(403).json({ error: 'Account pending approval' });
            }
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.promise.get(
            `SELECT id, email, username, role, profile_image, description, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Change password
router.post('/change-password', authenticateToken, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        // Get current password hash
        const user = await db.promise.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password incorrect' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await db.promise.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;

