
import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local if exists
if (fs.existsSync(path.resolve('.env.local'))) {
    dotenv.config({ path: '.env.local' });
}

async function listColumns() {
    console.log("🔍 Listing columns for amz_users...");
    try {
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'amz_users';
        `);
        console.log("Columns in amz_users:");
        result.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    } catch (error) {
        console.error("❌ Failed to list columns:", error);
    } finally {
        process.exit(0);
    }
}

listColumns();
