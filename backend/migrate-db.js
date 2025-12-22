const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/steph_world.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database for migration');
});

// Migration queries
const migrations = [
    // Add parent_id and likes_count to comments table if they don't exist
    {
        name: 'Add parent_id and likes_count to comments',
        queries: [
            // Check if parent_id column exists
            `SELECT COUNT(*) as count FROM pragma_table_info('comments') WHERE name='parent_id'`,
            // Add parent_id if it doesn't exist
            `ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE`,
            // Check if likes_count column exists
            `SELECT COUNT(*) as count FROM pragma_table_info('comments') WHERE name='likes_count'`,
            // Add likes_count if it doesn't exist
            `ALTER TABLE comments ADD COLUMN likes_count INTEGER DEFAULT 0`,
            // Check if updated_at column exists
            `SELECT COUNT(*) as count FROM pragma_table_info('comments') WHERE name='updated_at'`,
            // Add updated_at if it doesn't exist
            `ALTER TABLE comments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`
        ]
    },
    // Create comment_likes table
    {
        name: 'Create comment_likes table',
        query: `CREATE TABLE IF NOT EXISTS comment_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comment_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(comment_id, user_id)
        )`
    },
    // Create saved_posts table
    {
        name: 'Create saved_posts table',
        query: `CREATE TABLE IF NOT EXISTS saved_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            UNIQUE(user_id, post_id)
        )`
    },
    // Create indexes
    {
        name: 'Create indexes',
        queries: [
            `CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id)`,
            `CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id)`,
            `CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_saved_posts_post ON saved_posts(post_id)`
        ]
    }
];

let currentMigration = 0;

function runMigration(migration, callback) {
    console.log(`Running migration: ${migration.name}`);
    
    if (migration.query) {
        // Single query migration
        db.run(migration.query, (err) => {
            if (err) {
                // Ignore "duplicate column" errors for ALTER TABLE
                if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                    console.log(`  Skipped (already applied): ${migration.name}`);
                    callback();
                } else {
                    console.error(`  Error: ${err.message}`);
                    callback(err);
                }
            } else {
                console.log(`  ✓ Completed: ${migration.name}`);
                callback();
            }
        });
    } else if (migration.queries) {
        // Multiple queries migration
        let queryIndex = 0;
        
        function runNextQuery() {
            if (queryIndex >= migration.queries.length) {
                console.log(`  ✓ Completed: ${migration.name}`);
                callback();
                return;
            }
            
            const query = migration.queries[queryIndex];
            
            // Check if it's a SELECT query (for checking column existence)
            if (query.includes('SELECT COUNT(*)')) {
                db.get(query, (err, row) => {
                    if (err) {
                        console.error(`  Error checking: ${err.message}`);
                        callback(err);
                        return;
                    }
                    
                    const exists = row.count > 0;
                    queryIndex++;
                    
                    // If column exists, skip the next ALTER TABLE query
                    if (exists && queryIndex < migration.queries.length) {
                        const nextQuery = migration.queries[queryIndex];
                        if (nextQuery.includes('ALTER TABLE') && nextQuery.includes('ADD COLUMN')) {
                            console.log(`  Skipped (column already exists)`);
                            queryIndex++;
                        }
                    }
                    
                    runNextQuery();
                });
            } else {
                // Execute the query
                db.run(query, (err) => {
                    if (err) {
                        // Ignore "duplicate column" and "already exists" errors
                        if (err.message.includes('duplicate column') || 
                            err.message.includes('already exists') ||
                            err.message.includes('UNIQUE constraint failed')) {
                            console.log(`  Skipped (already applied)`);
                        } else {
                            console.error(`  Error: ${err.message}`);
                            callback(err);
                            return;
                        }
                    }
                    queryIndex++;
                    runNextQuery();
                });
            }
        }
        
        runNextQuery();
    } else {
        callback();
    }
}

function runAllMigrations() {
    if (currentMigration >= migrations.length) {
        console.log('\nAll migrations completed successfully!');
        db.close();
        process.exit(0);
        return;
    }
    
    runMigration(migrations[currentMigration], (err) => {
        if (err) {
            console.error(`\nMigration failed: ${migrations[currentMigration].name}`);
            console.error(err);
            db.close();
            process.exit(1);
            return;
        }
        
        currentMigration++;
        runAllMigrations();
    });
}

console.log('Starting database migration...\n');
runAllMigrations();

