
import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local if exists
import fs from 'fs';
if (fs.existsSync(path.resolve('.env.local'))) {
    dotenv.config({ path: '.env.local' });
}

async function verifyConnection() {
    console.log("Checking database connection...");
    if (!process.env.NETLIFY_DATABASE_URL) {
        console.error("❌ NETLIFY_DATABASE_URL is not set.");
        process.exit(1);
    }

    try {
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("✅ Database connection successful!");
        console.log("Result:", result.rows[0]);
    } catch (error) {
        console.error("❌ Failed to connect to database:", error);
    }
}

verifyConnection();
