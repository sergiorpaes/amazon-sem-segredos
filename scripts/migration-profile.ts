
import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    console.log('Running migration to add profile columns...');
    try {
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
