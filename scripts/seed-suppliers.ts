import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { suppliers } from "../src/db/schema";
import { SUPPLIERS } from "../src/data/suppliers";

if (!process.env.NETLIFY_DATABASE_URL) {
    throw new Error('NETLIFY_DATABASE_URL is not set in .env.local');
}

const pool = new Pool({ connectionString: process.env.NETLIFY_DATABASE_URL });
const db = drizzle(pool);

async function seed() {
    console.log('🌱 Seeding suppliers...');

    try {
        for (const supplier of SUPPLIERS) {
            await db.insert(suppliers).values({
                name: supplier.name,
                url: supplier.url,
                categories: supplier.categories,
                description: supplier.description,
                country: supplier.country,
                featured: supplier.featured || false,
                created_at: new Date()
            });
            console.log(`Initialized: ${supplier.name}`);
        }
        console.log('✅ Suppliers migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding suppliers:', error);
        process.exit(1);
    }
}

seed();
