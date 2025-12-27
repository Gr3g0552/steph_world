const db = require('./config/database');

async function migrateTags() {
    try {
        // Check if tags column exists
        const tableInfo = await db.promise.all("PRAGMA table_info(posts)");
        const hasTagsColumn = tableInfo.some(col => col.name === 'tags');
        
        if (!hasTagsColumn) {
            console.log('Adding tags column to posts table...');
            await db.promise.run("ALTER TABLE posts ADD COLUMN tags TEXT");
            console.log('Tags column added successfully');
        } else {
            console.log('Tags column already exists');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateTags();


