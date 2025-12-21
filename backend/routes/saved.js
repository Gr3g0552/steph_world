const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get saved posts
router.get('/', authenticateToken, async (req, res) => {
    try {
        const savedPosts = await db.promise.all(
            `SELECT p.*, u.username, u.profile_image,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
             FROM saved_posts sp
             JOIN posts p ON sp.post_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE sp.user_id = ? AND u.is_approved = 1
             ORDER BY sp.created_at DESC`,
            [req.user.id, req.user.id]
        );
        res.json(savedPosts);
    } catch (error) {
        console.error('Get saved posts error:', error);
        res.status(500).json({ error: 'Failed to get saved posts' });
    }
});

// Save post
router.post('/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);

        // Check if post exists
        const post = await db.promise.get('SELECT id FROM posts WHERE id = ?', [postId]);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if already saved
        const existing = await db.promise.get(
            'SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?',
            [req.user.id, postId]
        );

        if (existing) {
            return res.status(400).json({ error: 'Post already saved' });
        }

        await db.promise.run(
            'INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)',
            [req.user.id, postId]
        );

        res.json({ message: 'Post saved successfully' });
    } catch (error) {
        console.error('Save post error:', error);
        res.status(500).json({ error: 'Failed to save post' });
    }
});

// Unsave post
router.delete('/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);

        await db.promise.run(
            'DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?',
            [req.user.id, postId]
        );

        res.json({ message: 'Post unsaved successfully' });
    } catch (error) {
        console.error('Unsave post error:', error);
        res.status(500).json({ error: 'Failed to unsave post' });
    }
});

// Check if post is saved
router.get('/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);

        const saved = await db.promise.get(
            'SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?',
            [req.user.id, postId]
        );

        res.json({ saved: !!saved });
    } catch (error) {
        console.error('Check saved error:', error);
        res.status(500).json({ error: 'Failed to check saved status' });
    }
});

module.exports = router;
