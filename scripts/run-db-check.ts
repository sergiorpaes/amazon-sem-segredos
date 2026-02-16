
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load env vars first
dotenv.config({ path: '.env.local' });

async function main() {
    try {
        const dbUrl = process.env.NETLIFY_DATABASE_URL;
        console.log('NETLIFY_DATABASE_URL loaded:', dbUrl ? 'YES' : 'NO');
        if (dbUrl) console.log('URL starts with:', dbUrl.substring(0, 15) + '...');
        else {
            // Fallback
            if (process.env.DATABASE_URL) {
                console.log('Falling back to DATABASE_URL');
                process.env.NETLIFY_DATABASE_URL = process.env.DATABASE_URL;
            }
        }

        // Dynamic import to ensure process.env is set
        // Note: tsx should resolve .ts extension, but if using native node it might need .js or module resolution
        const { db } = await import('../src/db/index');

        console.log('Checking amz_listings table...');
        const tableCheck = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'amz_listings';
        `);

        if (tableCheck.rows.length === 0) {
            console.log('❌ Table amz_listings DOES NOT EXIST.');
        } else {
            console.log('✅ Table amz_listings EXISTS.');
            const columnsResult = await db.execute(sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'amz_listings';
            `);
            console.log('Columns:', columnsResult.rows);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking DB:', error);
        process.exit(1);
    }
}

main();
