const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateFile } = require('../middleware/security');

const router = express.Router();

// Configure multer for profile image uploads
// UPLOAD_PATH is set to /app/uploads in docker-compose.yml
const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../frontend/public/uploads');
const profileImagesDir = path.join(baseUploadPath, 'profiles');
if (!fs.existsSync(profileImagesDir)) {
    fs.mkdirSync(profileImagesDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileImagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for profile images
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'));
        }
    }
});

// Get user profile
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await db.promise.get(
            `SELECT id, username, profile_image, description, created_at 
             FROM users WHERE id = ? AND is_approved = 1`,
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Decode HTML entities in profile_image if present (fix for old encoded URLs)
        if (user.profile_image) {
            const { decodeHtmlEntities } = require('../middleware/security');
            user.profile_image = decodeHtmlEntities(user.profile_image);
        }

        // Get user posts count
        const postsCount = await db.promise.get(
            'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
            [userId]
        );

        // Get follow stats (handle missing table gracefully)
        let followersCount = { count: 0 };
        let followingCount = { count: 0 };
        try {
            followersCount = await db.promise.get(
                'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
                [userId]
            ) || { count: 0 };
            
            followingCount = await db.promise.get(
                'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
                [userId]
            ) || { count: 0 };
        } catch (error) {
            // If follows table doesn't exist, use default values
            console.warn('Follows table not available, using default values');
        }

        res.json({
            ...user,
            postsCount: postsCount.count,
            followersCount: followersCount.count,
            followingCount: followingCount.count
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Upload profile image
router.post('/profile/image', authenticateToken, profileUpload.single('image'), validateFile, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Get the relative path for the frontend
        const relativePath = `/uploads/profiles/${req.file.filename}`;
        // Use the origin from the request to determine the frontend URL
        const origin = req.headers.origin;
        let imageUrl;
        
        if (origin) {
            // Extract protocol and hostname from origin
            const url = new URL(origin);
            const protocol = url.protocol;
            const hostname = url.hostname;
            // Frontend runs on port 3000 (mapped from container port 80)
            const port = url.port || (protocol === 'https:' ? '443' : '3000');
            imageUrl = `${protocol}//${hostname}:${port}${relativePath}`;
        } else {
            // Fallback to localhost if no origin header
            imageUrl = `http://localhost:3000${relativePath}`;
        }

        // Delete old profile image if it exists and is a local file
        const user = await db.promise.get('SELECT profile_image FROM users WHERE id = ?', [req.user.id]);
        if (user && user.profile_image && user.profile_image.includes('/uploads/profiles/')) {
            const oldImagePath = path.join(__dirname, '../../frontend/public', user.profile_image);
            if (fs.existsSync(oldImagePath)) {
                try {
                    fs.unlinkSync(oldImagePath);
                } catch (e) {
                    console.warn('Could not delete old profile image:', e);
                }
            }
        }

        // Update user profile with new image
        await db.promise.run(
            'UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [imageUrl, req.user.id]
        );

        res.json({ 
            message: 'Profile image uploaded successfully',
            profile_image: imageUrl
        });
    } catch (error) {
        console.error('Upload profile image error:', error);
        // Delete uploaded file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Error deleting uploaded file:', e);
            }
        }
        res.status(500).json({ error: 'Failed to upload profile image' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('description').optional().isLength({ max: 2000 }),
    body('profile_image').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, description, profile_image } = req.body;
        const updates = [];
        const values = [];

        if (username) {
            // Check username uniqueness
            const existing = await db.promise.get(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, req.user.id]
            );
            if (existing) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.push('username = ?');
            values.push(username);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (profile_image !== undefined) {
            // Decode any HTML entities that might have been encoded
            const { decodeHtmlEntities } = require('../middleware/security');
            let sanitizedUrl = decodeHtmlEntities(profile_image.trim());
            
            // Remove any double encoding
            sanitizedUrl = decodeHtmlEntities(sanitizedUrl);
            
            // Validate URL format
            if (sanitizedUrl) {
                try {
                    // Try to parse as URL if it starts with http/https
                    if (sanitizedUrl.startsWith('http://') || sanitizedUrl.startsWith('https://')) {
                        const url = new URL(sanitizedUrl);
                        // Ensure it's http or https
                        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                            return res.status(400).json({ error: 'Invalid URL protocol. Only http and https are allowed.' });
                        }
                        sanitizedUrl = url.toString();
                    } else if (!sanitizedUrl.startsWith('/uploads/') && !sanitizedUrl.startsWith('data:')) {
                        // If it's not a relative path or data URL, it's invalid
                        return res.status(400).json({ error: 'Invalid URL format' });
                    }
                } catch (e) {
                    // If URL parsing fails, it might be a relative path
                    // Allow relative paths starting with /uploads/ or data URLs
                    if (!sanitizedUrl.startsWith('/uploads/') && !sanitizedUrl.startsWith('data:') && !sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
                        return res.status(400).json({ error: 'Invalid URL format' });
                    }
                }
            }
            
            updates.push('profile_image = ?');
            values.push(sanitizedUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.user.id);

        await db.promise.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user posts
router.get('/:id/posts', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const { decodeHtmlEntities } = require('../middleware/security');
        const posts = await db.promise.all(
            `SELECT p.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ? AND u.is_approved = 1
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`,
            [req.user.id, userId, limit, offset]
        );

        // Decode HTML entities in post titles and descriptions
        const decodedPosts = posts.map(post => ({
            ...post,
            title: post.title ? decodeHtmlEntities(post.title) : post.title,
            description: post.description ? decodeHtmlEntities(post.description) : post.description
        }));

        res.json(decodedPosts);
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

module.exports = router;

