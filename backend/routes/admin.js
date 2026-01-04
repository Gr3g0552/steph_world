const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for background image uploads
const backgroundImagesDir = process.env.UPLOAD_PATH || path.join(__dirname, '../../frontend/public/uploads/backgrounds');
if (!fs.existsSync(backgroundImagesDir)) {
    fs.mkdirSync(backgroundImagesDir, { recursive: true });
}

const backgroundStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, backgroundImagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bg-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const backgroundUpload = multer({
    storage: backgroundStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for background images
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

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users (pending and approved)
router.get('/users', async (req, res) => {
    try {
        const users = await db.promise.all(
            `SELECT id, email, username, role, profile_image, description, 
             is_approved, created_at,
             (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as posts_count
             FROM users
             ORDER BY created_at DESC`
        );
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Approve user
router.post('/users/:id/approve', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        await db.promise.run(
            'UPDATE users SET is_approved = 1 WHERE id = ?',
            [userId]
        );
        res.json({ message: 'User approved successfully' });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Prevent deleting admin account
        const user = await db.promise.get('SELECT role FROM users WHERE id = ?', [userId]);
        if (user && user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin account' });
        }

        await db.promise.run('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Update user (admin)
router.put('/users/:id', [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('description').optional().isLength({ max: 2000 }),
    body('is_approved').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = parseInt(req.params.id);
        const { username, description, profile_image, is_approved } = req.body;
        const updates = [];
        const values = [];

        if (username) {
            const existing = await db.promise.get(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
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

        if (is_approved !== undefined) {
            updates.push('is_approved = ?');
            values.push(is_approved ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        await db.promise.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Create category
router.post('/categories', [
    body('name').trim().notEmpty(),
    body('slug').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, slug, background_images, image_interval } = req.body;
        const bgImagesJson = background_images ? JSON.stringify(background_images) : '[]';
        const interval = image_interval || 3000;

        const result = await db.promise.run(
            'INSERT INTO categories (name, slug, background_images, image_interval) VALUES (?, ?, ?, ?)',
            [name, slug, bgImagesJson, interval]
        );

        const category = await db.promise.get('SELECT * FROM categories WHERE id = ?', [result.lastID]);
        if (category.background_images) {
            category.background_images = JSON.parse(category.background_images);
        }

        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update category
router.put('/categories/:id', [
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const categoryId = parseInt(req.params.id);
        const { name, slug, background_images, image_interval } = req.body;
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }

        if (slug) {
            updates.push('slug = ?');
            values.push(slug);
        }

        if (background_images !== undefined) {
            updates.push('background_images = ?');
            values.push(JSON.stringify(background_images));
        }

        if (image_interval !== undefined) {
            updates.push('image_interval = ?');
            values.push(image_interval);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(categoryId);
        await db.promise.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);

        const category = await db.promise.get('SELECT * FROM categories WHERE id = ?', [categoryId]);
        if (category.background_images) {
            category.background_images = JSON.parse(category.background_images);
        }

        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Upload background image for category
router.post('/categories/:id/background-image', backgroundUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const categoryId = parseInt(req.params.id);
        const category = await db.promise.get('SELECT background_images FROM categories WHERE id = ?', [categoryId]);
        
        if (!category) {
            // Delete uploaded file if category doesn't exist
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get the relative path for the frontend
        const relativePath = `/uploads/backgrounds/${req.file.filename}`;
        const imageUrl = `http://localhost:3000${relativePath}`;

        // Parse existing background images
        let backgroundImages = [];
        if (category.background_images) {
            try {
                backgroundImages = JSON.parse(category.background_images);
            } catch (e) {
                backgroundImages = [];
            }
        }

        // Add new image to the array
        backgroundImages.push(imageUrl);

        // Update category with new background images
        await db.promise.run(
            'UPDATE categories SET background_images = ? WHERE id = ?',
            [JSON.stringify(backgroundImages), categoryId]
        );

        res.json({ 
            message: 'Background image uploaded successfully',
            imageUrl,
            backgroundImages
        });
    } catch (error) {
        console.error('Upload background image error:', error);
        // Delete uploaded file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Error deleting uploaded file:', e);
            }
        }
        res.status(500).json({ error: 'Failed to upload background image' });
    }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        await db.promise.run('DELETE FROM categories WHERE id = ?', [categoryId]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Create subcategory
router.post('/categories/:categoryId/subcategories', [
    body('name').trim().notEmpty(),
    body('slug').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const categoryId = parseInt(req.params.categoryId);
        const { name, slug } = req.body;

        const result = await db.promise.run(
            'INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)',
            [categoryId, name, slug]
        );

        const subcategory = await db.promise.get('SELECT * FROM subcategories WHERE id = ?', [result.lastID]);
        res.status(201).json(subcategory);
    } catch (error) {
        console.error('Create subcategory error:', error);
        res.status(500).json({ error: 'Failed to create subcategory' });
    }
});

// Update subcategory
router.put('/subcategories/:id', [
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const subcategoryId = parseInt(req.params.id);
        const { name, slug } = req.body;
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }

        if (slug) {
            updates.push('slug = ?');
            values.push(slug);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(subcategoryId);
        await db.promise.run(`UPDATE subcategories SET ${updates.join(', ')} WHERE id = ?`, values);

        const subcategory = await db.promise.get('SELECT * FROM subcategories WHERE id = ?', [subcategoryId]);
        res.json(subcategory);
    } catch (error) {
        console.error('Update subcategory error:', error);
        res.status(500).json({ error: 'Failed to update subcategory' });
    }
});

// Delete subcategory
router.delete('/subcategories/:id', async (req, res) => {
    try {
        const subcategoryId = parseInt(req.params.id);
        await db.promise.run('DELETE FROM subcategories WHERE id = ?', [subcategoryId]);
        res.json({ message: 'Subcategory deleted successfully' });
    } catch (error) {
        console.error('Delete subcategory error:', error);
        res.status(500).json({ error: 'Failed to delete subcategory' });
    }
});

// Get all posts (admin view)
router.get('/posts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const { decodeHtmlEntities } = require('../middleware/security');
        const posts = await db.promise.all(
            `SELECT p.*, u.username, u.email,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
             FROM posts p
             JOIN users u ON p.user_id = u.id
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

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

// Delete post (admin)
router.delete('/posts/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const post = await db.promise.get('SELECT file_path FROM posts WHERE id = ?', [postId]);

        if (post && post.file_path) {
            const fs = require('fs');
            const path = require('path');
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

// Pinned messages
router.get('/pinned-messages', async (req, res) => {
    try {
        const userId = req.query.user_id;
        let query = `
            SELECT pm.*, u.username, u.email
            FROM pinned_messages pm
            JOIN users u ON pm.user_id = u.id
        `;
        const params = [];

        if (userId) {
            query += ' WHERE pm.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY pm.created_at DESC';

        const messages = await db.promise.all(query, params);
        res.json(messages);
    } catch (error) {
        console.error('Get pinned messages error:', error);
        res.status(500).json({ error: 'Failed to get pinned messages' });
    }
});

router.post('/pinned-messages', [
    body('user_id').isInt(),
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { user_id, title, content } = req.body;
        const result = await db.promise.run(
            'INSERT INTO pinned_messages (user_id, title, content) VALUES (?, ?, ?)',
            [user_id, title, content]
        );

        const message = await db.promise.get('SELECT * FROM pinned_messages WHERE id = ?', [result.lastID]);
        res.status(201).json(message);
    } catch (error) {
        console.error('Create pinned message error:', error);
        res.status(500).json({ error: 'Failed to create pinned message' });
    }
});

router.put('/pinned-messages/:id', [
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const messageId = parseInt(req.params.id);
        const { title, content } = req.body;
        const updates = [];
        const values = [];

        if (title) {
            updates.push('title = ?');
            values.push(title);
        }

        if (content) {
            updates.push('content = ?');
            values.push(content);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(messageId);
        await db.promise.run(`UPDATE pinned_messages SET ${updates.join(', ')} WHERE id = ?`, values);

        const message = await db.promise.get('SELECT * FROM pinned_messages WHERE id = ?', [messageId]);
        res.json(message);
    } catch (error) {
        console.error('Update pinned message error:', error);
        res.status(500).json({ error: 'Failed to update pinned message' });
    }
});

router.delete('/pinned-messages/:id', async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        await db.promise.run('DELETE FROM pinned_messages WHERE id = ?', [messageId]);
        res.json({ message: 'Pinned message deleted successfully' });
    } catch (error) {
        console.error('Delete pinned message error:', error);
        res.status(500).json({ error: 'Failed to delete pinned message' });
    }
});

module.exports = router;

