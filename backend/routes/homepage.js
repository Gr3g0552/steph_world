const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get homepage settings (public route)
router.get('/', async (req, res) => {
    try {
        const settings = await db.promise.get(
            'SELECT * FROM homepage_settings WHERE id = 1'
        );

        if (!settings) {
            // Initialize if not exists
            await db.promise.run(
                'INSERT INTO homepage_settings (id, background_images, image_interval) VALUES (1, ?, ?)',
                ['[]', 3000]
            );
            return res.json({ background_images: [], image_interval: 3000 });
        }

        if (settings.background_images) {
            try {
                settings.background_images = JSON.parse(settings.background_images);
            } catch (e) {
                settings.background_images = [];
            }
        } else {
            settings.background_images = [];
        }

        res.json(settings);
    } catch (error) {
        console.error('Get homepage settings error:', error);
        res.status(500).json({ error: 'Failed to get homepage settings' });
    }
});

// Update homepage settings (admin only)
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { background_images, image_interval } = req.body;
        const bgImagesJson = background_images ? JSON.stringify(background_images) : '[]';
        const interval = image_interval || 3000;

        await db.promise.run(
            `UPDATE homepage_settings 
             SET background_images = ?, image_interval = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = 1`,
            [bgImagesJson, interval]
        );

        const settings = await db.promise.get('SELECT * FROM homepage_settings WHERE id = 1');
        if (settings.background_images) {
            settings.background_images = JSON.parse(settings.background_images);
        }

        res.json(settings);
    } catch (error) {
        console.error('Update homepage settings error:', error);
        res.status(500).json({ error: 'Failed to update homepage settings' });
    }
});

module.exports = router;

