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

        const { decodeHtmlEntities } = require('../middleware/security');
        const posts = await db.promise.all(query, params);
        
        // Decode HTML entities in post titles and descriptions
        // Parse tags JSON if present
        const decodedPosts = posts.map(post => {
            let tags = [];
            if (post.tags) {
                try {
                    tags = JSON.parse(post.tags);
                } catch (e) {
                    tags = [];
                }
            }
            return {
                ...post,
                title: post.title ? decodeHtmlEntities(post.title) : post.title,
                description: post.description ? decodeHtmlEntities(post.description) : post.description,
                tags: tags
            };
        });
        
        res.json(decodedPosts);
    } catch (error) {
        console.error('Search posts error:', error);
        res.status(500).json({ error: 'Failed to search posts' });
    }
});

// Search users (or get all users if no query)
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const { q, limit = 50, offset = 0 } = req.query;
        
        let query;
        let params;

        if (q && q.trim().length >= 2) {
            // Search mode: filter by query
            const searchTerm = `%${q.trim()}%`;
            query = `
                SELECT u.id, u.username, u.profile_image, u.description, u.last_activity,
                        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
                        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
                 FROM users u
                 WHERE u.is_approved = 1
                 AND (u.username LIKE ? OR u.description LIKE ?)
                 ORDER BY u.username ASC
                 LIMIT ? OFFSET ?
            `;
            params = [req.user.id, searchTerm, searchTerm, parseInt(limit), parseInt(offset)];
        } else {
            // Default mode: return all approved users
            query = `
                SELECT u.id, u.username, u.profile_image, u.description, u.last_activity,
                        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
                        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
                        EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
                 FROM users u
                 WHERE u.is_approved = 1
                 ORDER BY u.username ASC
                 LIMIT ? OFFSET ?
            `;
            params = [req.user.id, parseInt(limit), parseInt(offset)];
        }

        const users = await db.promise.all(query, params);

        // Calculate online status (online if last_activity is within last 5 minutes)
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        const usersWithStatus = users.map(user => {
            let isOnline = false;
            if (user.last_activity) {
                const lastActivity = new Date(user.last_activity);
                isOnline = lastActivity > fiveMinutesAgo;
            }
            return {
                ...user,
                is_online: isOnline
            };
        });

        res.json(usersWithStatus);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

module.exports = router;

