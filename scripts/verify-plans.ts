
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../src/db';
import { plans } from '../src/db/schema';

async function verify() {
    try {
        const allPlans = await db.select().from(plans);
        console.log('Seeded Plans:', JSON.stringify(allPlans, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
verify();
