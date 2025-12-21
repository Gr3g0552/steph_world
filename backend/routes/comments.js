const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { commentLimiter, validateInput } = require('../middleware/security');

const router = express.Router();

// Like comment
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const userId = req.user.id;

        // Check if already liked
        const existingLike = await db.promise.get(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (existingLike) {
            // Unlike
            await db.promise.run(
                'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
                [commentId, userId]
            );
            await db.promise.run(
                'UPDATE comments SET likes_count = likes_count - 1 WHERE id = ?',
                [commentId]
            );
            res.json({ liked: false });
        } else {
            // Like
            await db.promise.run(
                'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
                [commentId, userId]
            );
            await db.promise.run(
                'UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?',
                [commentId]
            );
            res.json({ liked: true });
        }
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({ error: 'Failed to like comment' });
    }
});

// Update comment
router.put('/:id', authenticateToken, commentLimiter, [
    body('content').trim().notEmpty().isLength({ max: 1000 }).escape()
], validateInput, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const { content } = req.body;

        // Check ownership
        const comment = await db.promise.get(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await db.promise.run(
            'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, commentId]
        );

        const updated = await db.promise.get(
            `SELECT c.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
             EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [req.user.id, commentId]
        );

        res.json(updated);
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);

        // Check ownership
        const comment = await db.promise.get(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Get post_id before deleting
        const commentData = await db.promise.get('SELECT post_id FROM comments WHERE id = ?', [commentId]);
        
        await db.promise.run('DELETE FROM comments WHERE id = ?', [commentId]);
        
        // Update comments count
        if (commentData) {
            await db.promise.run(
                'UPDATE posts SET comments_count = comments_count - 1 WHERE id = ?',
                [commentData.post_id]
            );
        }
        
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;

