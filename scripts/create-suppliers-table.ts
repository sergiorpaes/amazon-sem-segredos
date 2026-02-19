
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from "drizzle-orm";

if (!process.env.NETLIFY_DATABASE_URL) {
    throw new Error('NETLIFY_DATABASE_URL is not set in .env.local');
}

const pool = new Pool({ connectionString: process.env.NETLIFY_DATABASE_URL });
const db = drizzle(pool);

async function createTable() {
    console.log('🛠 Creating amz_suppliers table...');
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS amz_suppliers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                categories JSONB NOT NULL,
                description TEXT,
                country TEXT,
                featured BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createTable();
