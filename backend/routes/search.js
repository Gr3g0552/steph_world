const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');

const router = express.Router();

// Search posts
router.get('/posts', authenticateToken, async (req, res) => {
    try {
        const { q, category_id, limit = 20, offset = 0 } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const searchTerm = `%${q.trim()}%`;
        let query = `
            SELECT p.*, u.username, u.profile_image,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                   EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE u.is_approved = 1
            AND (p.title LIKE ? OR p.description LIKE ?)
        `;
        const params = [req.user.id, searchTerm, searchTerm];

        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(parseInt(category_id));
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const posts = await db.promise.all(query, params);
        res.json(posts);
    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ error: 'Failed to search posts' });
    }
});

// Search users
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const searchTerm = `%${q.trim()}%`;
        const users = await db.promise.all(
            `SELECT u.id, u.username, u.profile_image, u.description,
                    (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
                    (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                    EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
             FROM users u
             WHERE u.is_approved = 1
             AND (u.username LIKE ? OR u.description LIKE ?)
             ORDER BY u.username ASC
             LIMIT ? OFFSET ?`,
            [req.user.id, searchTerm, searchTerm, parseInt(limit), parseInt(offset)]
        );

        res.json(users);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

module.exports = router;

