
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
    console.log("🚀 Starting comprehensive manual migration (v3)...");

    if (!process.env.NETLIFY_DATABASE_URL) {
        console.error("❌ NETLIFY_DATABASE_URL is not set.");
        process.exit(1);
    }

    try {
        const columnsResult = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'amz_users';
        `);
        const columns = columnsResult.rows.map(r => r.column_name);
        console.log("Current columns:", columns);

        // 1. Rename username -> email
        if (columns.includes('username') && !columns.includes('email')) {
            console.log("Renaming 'username' to 'email'...");
            await db.execute(sql`ALTER TABLE amz_users RENAME COLUMN username TO email;`);
        }

        // 2. Rename password -> password_hash
        if (columns.includes('password') && !columns.includes('password_hash')) {
            console.log("Renaming 'password' to 'password_hash'...");
            await db.execute(sql`ALTER TABLE amz_users RENAME COLUMN password TO password_hash;`);
        }

        // 3. Add base SaaS columns
        const baseCols = [
            { name: 'role', type: 'TEXT DEFAULT \'USER\' NOT NULL' },
            { name: 'credits_balance', type: 'INTEGER DEFAULT 5 NOT NULL' },
            { name: 'stripe_customer_id', type: 'TEXT' },
            { name: 'banned_at', type: 'TIMESTAMP' }
        ];

        for (const col of baseCols) {
            const currentCols = (await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'amz_users';`)).rows.map(r => r.column_name);
            if (!currentCols.includes(col.name)) {
                console.log(`Adding column: ${col.name}...`);
                await db.execute(sql.raw(`ALTER TABLE amz_users ADD COLUMN ${col.name} ${col.type};`));
            }
        }

        // 4. Ensure profile columns from previous step
        const profileCols = [
            'phone',
            'company_name',
            'address_street',
            'address_city',
            'address_state',
            'address_zip'
        ];

        for (const col of profileCols) {
            const currentCols = (await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'amz_users';`)).rows.map(r => r.column_name);
            if (!currentCols.includes(col)) {
                console.log(`Adding profile column: ${col}...`);
                await db.execute(sql.raw(`ALTER TABLE amz_users ADD COLUMN ${col} TEXT;`));
            }
        }

        console.log("✅ Database schema is now fully synchronized!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

runMigration();
