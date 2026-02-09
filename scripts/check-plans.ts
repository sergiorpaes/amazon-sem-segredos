
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listPlans() {
    console.log('Listing existing plans...');
    try {
        const { db } = await import('../src/db');
        const { plans } = await import('../src/db/schema');
        const results = await db.select().from(plans);
        console.log('Plans in DB:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Failed to list plans:', error);
    } finally {
        process.exit(0);
    }
}

listPlans();
