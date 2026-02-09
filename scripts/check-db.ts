
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sql } from 'drizzle-orm';

async function checkColumns() {
    console.log('Checking columns for amz_users...');
    try {
        // Dynamic import to ensure process.env is ready
        const { db } = await import('../src/db');

        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'amz_users';
        `);
        console.log('Columns found:', JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('Failed to check columns:', error);
    } finally {
        process.exit(0);
    }
}

checkColumns();
