import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from "../src/db";
import { suppliers } from "../src/db/schema";
import { SUPPLIERS } from "../src/data/suppliers";

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
