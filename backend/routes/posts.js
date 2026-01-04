const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateFile, validateInput } = require('../middleware/security');
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
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    fileFilter: (req, file, cb) => {
        console.log('Multer fileFilter - File received:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            fieldname: file.fieldname
        });
        
        // Allow images, videos, and audio files
        const allowedExtensions = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|mp3|wav|ogg|m4a|aac|flac|wma/;
        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        
        // Check MIME type - allow image/*, video/*, and audio/*
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        
        if (extname && (isImage || isVideo || isAudio)) {
            console.log('File accepted by multer');
            cb(null, true);
        } else {
            console.log('File rejected by multer:', { extname, isImage, isVideo, isAudio });
            cb(new Error('Invalid file type. Allowed: images, videos, and audio files'));
        }
    }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 200MB' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
};

// Create post
// Order matters: authenticateToken -> upload.single -> handleMulterError -> validateFile -> validators -> validateInput -> handler
router.post('/', authenticateToken, upload.single('file'), handleMulterError, (req, res, next) => {
    // Debug middleware to check if file was parsed
    console.log('After multer - File parsed:', !!req.file);
    if (req.file) {
        console.log('File details:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } else {
        console.log('No file in req.file. Multer may have failed.');
        console.log('Request headers:', req.headers['content-type']);
        console.log('Request body keys:', Object.keys(req.body || {}));
    }
    next();
}, validateFile, [
    body('title').optional().trim().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('category_id').isInt({ min: 1 }),
    body('subcategory_id').optional().isInt({ min: 1 })
], validateInput, async (req, res) => {
    try {
        // Debug logging for file upload issues
        console.log('POST /posts - File upload request received');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Has file:', !!req.file);
        console.log('File info:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'none');
        console.log('Body keys:', Object.keys(req.body));
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
            console.error('No file in request. Multer may have failed to parse the file.');
            return res.status(400).json({ error: 'File required' });
        }

        const { title, description, category_id, subcategory_id } = req.body;
        // Determine file type: image, video, or audio
        let fileType = 'video'; // default
        if (req.file.mimetype.startsWith('image/')) {
            fileType = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
            fileType = 'video';
        } else if (req.file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
        }
        const filePath = `/uploads/${req.file.filename}`;

        const result = await db.promise.run(
            `INSERT INTO posts (user_id, category_id, subcategory_id, title, description, file_path, file_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, category_id, subcategory_id || null, title || null, description || null, filePath, fileType]
        );

        const { decodeHtmlEntities } = require('../middleware/security');
        const post = await db.promise.get(
            `SELECT p.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [result.lastID]
        );

        // Decode HTML entities in post title and description
        if (post) {
            post.title = post.title ? decodeHtmlEntities(post.title) : post.title;
            post.description = post.description ? decodeHtmlEntities(post.description) : post.description;
        }

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

        const { decodeHtmlEntities } = require('../middleware/security');
        const posts = await db.promise.all(query, params);
        // Decode HTML entities in post titles and descriptions
        const decodedPosts = posts.map(post => ({
            ...post,
            title: post.title ? decodeHtmlEntities(post.title) : post.title,
            description: post.description ? decodeHtmlEntities(post.description) : post.description
        }));
        res.json(decodedPosts);
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

        // Decode HTML entities in post title and description
        const { decodeHtmlEntities } = require('../middleware/security');
        post.title = post.title ? decodeHtmlEntities(post.title) : post.title;
        post.description = post.description ? decodeHtmlEntities(post.description) : post.description;

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
        
        // Return updated post
        const { decodeHtmlEntities } = require('../middleware/security');
        const updatedPost = await db.promise.get(
            `SELECT p.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [req.user.id, postId]
        );
        
        // Decode HTML entities in post title and description
        if (updatedPost) {
            updatedPost.title = updatedPost.title ? decodeHtmlEntities(updatedPost.title) : updatedPost.title;
            updatedPost.description = updatedPost.description ? decodeHtmlEntities(updatedPost.description) : updatedPost.description;
        }
        
        res.json(updatedPost);
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
        const { decodeHtmlEntities } = require('../middleware/security');
        const comments = await db.promise.all(
            `SELECT c.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
             EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ? AND u.is_approved = 1
             ORDER BY c.created_at ASC`,
            [req.user.id, postId]
        );
        // Decode HTML entities in comment content for proper display
        const decodedComments = comments.map(comment => ({
            ...comment,
            content: decodeHtmlEntities(comment.content)
        }));
        res.json(decodedComments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Add comment
router.post('/:id/comments', authenticateToken, [
    body('content').trim().notEmpty().withMessage('Content is required').isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters').escape(), // Escape HTML to prevent XSS
    body('parent_id').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Parent ID must be a positive integer')
], validateInput, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        let { content, parent_id } = req.body;
        
        // Ensure content is not empty after trimming
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content cannot be empty' });
        }
        
        // Convert parent_id to null if it's not a valid integer
        if (parent_id !== undefined && parent_id !== null) {
            parent_id = parseInt(parent_id);
            if (isNaN(parent_id) || parent_id < 1) {
                parent_id = null;
            }
        } else {
            parent_id = null;
        }

        // Content is already escaped by express-validator, store it as-is
        const result = await db.promise.run(
            'INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
            [postId, req.user.id, content, parent_id || null]
        );

        // Update comments count
        await db.promise.run(
            'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
            [postId]
        );

        const { decodeHtmlEntities } = require('../middleware/security');
        const comment = await db.promise.get(
            `SELECT c.*, u.username, u.profile_image,
             (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
             EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [req.user.id, result.lastID]
        );

        // Decode HTML entities in comment content for proper display
        if (comment) {
            comment.content = decodeHtmlEntities(comment.content);
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

module.exports = router;

