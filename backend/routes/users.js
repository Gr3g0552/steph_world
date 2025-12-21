const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

// Update user profile
router.put('/profile', authenticateToken, [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('description').optional().isLength({ max: 2000 })
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
            updates.push('profile_image = ?');
            values.push(profile_image);
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

        res.json(posts);
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

module.exports = router;

