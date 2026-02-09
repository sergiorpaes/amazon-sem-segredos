
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Running migration to add profile columns...');
    try {
        const { db } = await import('../src/db');
        await db.execute(sql`
            ALTER TABLE amz_users 
            ADD COLUMN IF NOT EXISTS full_name TEXT,
            ADD COLUMN IF NOT EXISTS profile_image TEXT;
        `);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

migrate();
