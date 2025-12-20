const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../../frontend/public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Create post
router.post('/', authenticateToken, upload.single('file'), [
    body('title').optional().trim().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('category_id').isInt(),
    body('subcategory_id').optional().isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'File required' });
        }

        const { title, description, category_id, subcategory_id } = req.body;
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        const filePath = `/uploads/${req.file.filename}`;

        const result = await db.promise.run(
            `INSERT INTO posts (user_id, category_id, subcategory_id, title, description, file_path, file_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, category_id, subcategory_id || null, title || null, description || null, filePath, fileType]
        );

        const post = await db.promise.get(
            `SELECT p.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [result.lastID]
        );

        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get posts (feed)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const categoryId = req.query.category_id;
        const subcategoryId = req.query.subcategory_id;

        let query = `
            SELECT p.*, u.username, u.profile_image,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
            EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE u.is_approved = 1
        `;
        const params = [req.user.id];

        if (categoryId) {
            query += ' AND p.category_id = ?';
            params.push(categoryId);
        }
        if (subcategoryId) {
            query += ' AND p.subcategory_id = ?';
            params.push(subcategoryId);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const posts = await db.promise.all(query, params);
        res.json(posts);
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// Get single post
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const post = await db.promise.get(
            `SELECT p.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ? AND u.is_approved = 1`,
            [req.user.id, postId]
        );

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Failed to get post' });
    }
});

// Update post (owner or admin only)
router.put('/:id', authenticateToken, [
    body('title').optional().trim().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const postId = parseInt(req.params.id);
        const post = await db.promise.get('SELECT user_id FROM posts WHERE id = ?', [postId]);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { title, description } = req.body;
        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(postId);

        await db.promise.run(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const post = await db.promise.get('SELECT user_id, file_path FROM posts WHERE id = ?', [postId]);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Delete file
        if (post.file_path) {
            const filePath = path.join(__dirname, '../../frontend/public', post.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.promise.run('DELETE FROM posts WHERE id = ?', [postId]);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Like/Unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        
        // Check if already liked
        const existing = await db.promise.get(
            'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, req.user.id]
        );

        if (existing) {
            // Unlike
            await db.promise.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id]);
            res.json({ liked: false });
        } else {
            // Like
            await db.promise.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, req.user.id]);
            res.json({ liked: true });
        }
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// Get comments
router.get('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const comments = await db.promise.all(
            `SELECT c.*, u.username, u.profile_image
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ? AND u.is_approved = 1
             ORDER BY c.created_at ASC`,
            [postId]
        );
        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Add comment
router.post('/:id/comments', authenticateToken, [
    body('content').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const postId = parseInt(req.params.id);
        const { content } = req.body;

        const result = await db.promise.run(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, req.user.id, content]
        );

        const comment = await db.promise.get(
            `SELECT c.*, u.username, u.profile_image
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [result.lastID]
        );

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

module.exports = router;

