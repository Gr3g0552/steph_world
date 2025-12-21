const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/steph_world.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

// Créer le répertoire si nécessaire
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Read and execute schema
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Read schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Error executing schema:', err);
        process.exit(1);
    }
    console.log('Schema executed successfully');
    
    // Create default admin user
    const adminEmail = 'gregory.monsoro@gmail.com';
    const adminPassword = 'Admin123!'; // Will be changed on first login
    const hashedPassword = bcrypt.hashSync(adminPassword, 12);
    
    db.run(
        `INSERT OR IGNORE INTO users (email, username, password_hash, role, is_approved) 
         VALUES (?, ?, ?, 'admin', 1)`,
        [adminEmail, 'admin', hashedPassword],
        function(err) {
            if (err) {
                console.error('Error creating admin user:', err);
            } else {
                console.log('Admin user created:', adminEmail);
            }
            
            // Initialize default categories
            initializeCategories();
        }
    );
});

function initializeCategories() {
    const categories = [
        {
            name: 'Arts',
            slug: 'arts',
            subcategories: ['Dessins', 'Photos', 'Peintures']
        },
        {
            name: 'Vidéos',
            slug: 'videos',
            subcategories: ['Vlogs', 'Lifestyle', 'Recettes', 'Blagues']
        },
        {
            name: 'Memes',
            slug: 'memes',
            subcategories: ['Creations originales', 'Social Medias']
        }
    ];
    
    categories.forEach((cat, index) => {
        db.run(
            `INSERT OR IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)`,
            [index + 1, cat.name, cat.slug],
            function(err) {
                if (err) {
                    console.error(`Error creating category ${cat.name}:`, err);
                } else {
                    const categoryId = this.lastID || index + 1;
                    cat.subcategories.forEach(sub => {
                        db.run(
                            `INSERT OR IGNORE INTO subcategories (category_id, name, slug) 
                             VALUES (?, ?, ?)`,
                            [categoryId, sub, sub.toLowerCase().replace(/\s+/g, '-')],
                            (err) => {
                                if (err) console.error(`Error creating subcategory ${sub}:`, err);
                            }
                        );
                    });
                }
            }
        );
    });
    
    // Initialize homepage settings
    db.run(
        `INSERT OR IGNORE INTO homepage_settings (id, background_images) 
         VALUES (1, '[]')`,
        (err) => {
            if (err) {
                console.error('Error initializing homepage settings:', err);
            } else {
                console.log('Database initialization complete');
                db.close();
            }
        }
    );
}

