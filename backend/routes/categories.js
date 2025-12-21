const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all categories with subcategories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const categories = await db.promise.all(
            'SELECT * FROM categories ORDER BY id ASC'
        );

        for (const category of categories) {
            const subcategories = await db.promise.all(
                'SELECT * FROM subcategories WHERE category_id = ? ORDER BY id ASC',
                [category.id]
            );
            category.subcategories = subcategories;
            
            // Parse background images JSON
            if (category.background_images) {
                try {
                    category.background_images = JSON.parse(category.background_images);
                } catch (e) {
                    category.background_images = [];
                }
            } else {
                category.background_images = [];
            }
            // Set default interval if not set
            if (!category.image_interval) {
                category.image_interval = 3000;
            }
        }

        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get single category
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const category = await db.promise.get(
            'SELECT * FROM categories WHERE id = ?',
            [categoryId]
        );

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const subcategories = await db.promise.all(
            'SELECT * FROM subcategories WHERE category_id = ? ORDER BY id ASC',
            [categoryId]
        );
        category.subcategories = subcategories;

        if (category.background_images) {
            try {
                category.background_images = JSON.parse(category.background_images);
            } catch (e) {
                category.background_images = [];
            }
        } else {
            category.background_images = [];
        }
        // Set default interval if not set
        if (!category.image_interval) {
            category.image_interval = 3000;
        }

        res.json(category);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Failed to get category' });
    }
});

module.exports = router;

