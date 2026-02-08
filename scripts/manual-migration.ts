
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
    console.log("🚀 Starting manual migration (v4 - Activation)...");

    if (!process.env.NETLIFY_DATABASE_URL) {
        console.error("❌ NETLIFY_DATABASE_URL is not set.");
        process.exit(1);
    }

    try {
        const columns = [
            { name: 'activated_at', type: 'TIMESTAMP' },
            { name: 'activation_token', type: 'TEXT' }
        ];

        for (const col of columns) {
            console.log(`Adding column: ${col.name}...`);
            await db.execute(sql.raw(`ALTER TABLE amz_users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`));
        }

        // Also promote the existing admin to "activated" so he doesn't get locked out
        console.log("Activating existing admin user...");
        await db.execute(sql`UPDATE amz_users SET activated_at = NOW() WHERE email = 'sergiorobertopaes@gmail.com';`);

        console.log("✅ Database schema updated with activation columns!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

runMigration();
