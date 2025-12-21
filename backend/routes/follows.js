const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Follow user
router.post('/:userId', authenticateToken, async (req, res) => {
    try {
        const followingId = parseInt(req.params.userId);
        const followerId = req.user.id;

        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if already following
        const existing = await db.promise.get(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existing) {
            return res.status(400).json({ error: 'Already following this user' });
        }

        await db.promise.run(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, followingId]
        );

        res.json({ message: 'Successfully followed user' });
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow user
router.delete('/:userId', authenticateToken, async (req, res) => {
    try {
        const followingId = parseInt(req.params.userId);
        const followerId = req.user.id;

        await db.promise.run(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Check if following
router.get('/check/:userId', authenticateToken, async (req, res) => {
    try {
        const followingId = parseInt(req.params.userId);
        const followerId = req.user.id;

        const follow = await db.promise.get(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        res.json({ following: !!follow });
    } catch (error) {
        console.error('Check follow error:', error);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
});

// Get followers
router.get('/:userId/followers', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const followers = await db.promise.all(
            `SELECT u.id, u.username, u.profile_image
             FROM follows f
             JOIN users u ON f.follower_id = u.id
             WHERE f.following_id = ? AND u.is_approved = 1
             ORDER BY f.created_at DESC`,
            [userId]
        );
        res.json(followers);
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Failed to get followers' });
    }
});

// Get following
router.get('/:userId/following', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const following = await db.promise.all(
            `SELECT u.id, u.username, u.profile_image
             FROM follows f
             JOIN users u ON f.following_id = u.id
             WHERE f.follower_id = ? AND u.is_approved = 1
             ORDER BY f.created_at DESC`,
            [userId]
        );
        res.json(following);
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Failed to get following' });
    }
});

module.exports = router;
