
import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local if exists
if (fs.existsSync(path.resolve('.env.local'))) {
    dotenv.config({ path: '.env.local' });
}

async function runMigration() {
    console.log("🚀 Starting manual migration (v2)...");

    if (!process.env.NETLIFY_DATABASE_URL) {
        console.error("❌ NETLIFY_DATABASE_URL is not set.");
        process.exit(1);
    }

    try {
        // Step 1: Rename users to amz_users if amz_users doesn't exist but users does
        const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`);
        const tableNames = tables.rows.map(r => r.table_name);

        if (tableNames.includes('users') && !tableNames.includes('amz_users')) {
            console.log("Renaming 'users' to 'amz_users'...");
            await db.execute(sql`ALTER TABLE users RENAME TO amz_users;`);
        }

        // Step 2: Add columns
        const columns = [
            'phone',
            'company_name',
            'address_street',
            'address_city',
            'address_state',
            'address_zip'
        ];

        for (const col of columns) {
            console.log(`Adding column: ${col}...`);
            await db.execute(sql.raw(`ALTER TABLE amz_users ADD COLUMN IF NOT EXISTS ${col} TEXT;`));
        }

        console.log("✅ All columns added successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

runMigration();
