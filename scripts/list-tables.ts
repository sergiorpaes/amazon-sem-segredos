
import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local if exists
if (fs.existsSync(path.resolve('.env.local'))) {
    dotenv.config({ path: '.env.local' });
}

async function listTables() {
    console.log("🔍 Listing tables...");
    try {
        const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`);
        console.log("Tables found:", result.rows.map(r => r.table_name));
    } catch (error) {
        console.error("❌ Failed to list tables:", error);
    } finally {
        process.exit(0);
    }
}

listTables();
