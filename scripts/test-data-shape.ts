
import * as dotenv from 'dotenv';
import { desc } from 'drizzle-orm';

// Load env vars
dotenv.config({ path: '.env.local' });

async function main() {
    try {
        const dbUrl = process.env.NETLIFY_DATABASE_URL;
        console.log('NETLIFY_DATABASE_URL loaded:', dbUrl ? 'YES' : 'NO');
        if (!dbUrl && process.env.DATABASE_URL) {
            process.env.NETLIFY_DATABASE_URL = process.env.DATABASE_URL;
        }

        // Dynamic import
        const { db } = await import('../src/db/index');
        const { listings } = await import('../src/db/schema');

        console.log('Fetching listings from DB to check shape...');
        const userListings = await db.select()
            .from(listings)
            .orderBy(desc(listings.created_at))
            .limit(1);

        console.log('Listings found:', userListings.length);
        if (userListings.length > 0) {
            console.log('Sample Listing Keys:', Object.keys(userListings[0]));
            // Check generated_images specifically
            console.log('generated_images value:', userListings[0].generated_images);
            console.log('generated_images type:', typeof userListings[0].generated_images);
            console.log('generated_images isArray:', Array.isArray(userListings[0].generated_images));
            console.log('Sample Listing Data:', JSON.stringify(userListings[0], null, 2));
        } else {
            console.log('No listings found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fetching listings:', error);
        process.exit(1);
    }
}

main();
