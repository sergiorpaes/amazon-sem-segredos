
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
// Load env vars FIRST
dotenv.config({ path: '.env.local' });

async function main() {
    try {
        const dbUrl = process.env.NETLIFY_DATABASE_URL;
        console.log('NETLIFY_DATABASE_URL loaded:', dbUrl ? 'YES' : 'NO');
        if (!dbUrl && process.env.DATABASE_URL) {
            console.log('Falling back to DATABASE_URL');
            process.env.NETLIFY_DATABASE_URL = process.env.DATABASE_URL;
        }

        // Dynamic import
        const { db } = await import('../src/db/index');

        console.log('Creating amz_listings table...');

        // Check if table exists first (double check)
        const tableCheck = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'amz_listings';
        `);

        if (tableCheck.rows.length > 0) {
            console.log('✅ Table amz_listings already exists.');
            process.exit(0);
        }

        // Create table
        await db.execute(sql`
            CREATE TABLE "amz_listings" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" integer NOT NULL,
                "product_name" text NOT NULL,
                "listing_data" jsonb NOT NULL,
                "generated_images" text[],
                "created_at" timestamp DEFAULT now()
            );
        `);
        console.log('✅ Table amz_listings created.');

        // Add foreign key
        console.log('Adding foreign key constraint...');
        await db.execute(sql`
            ALTER TABLE "amz_listings" 
            ADD CONSTRAINT "amz_listings_user_id_amz_users_id_fk" 
            FOREIGN KEY ("user_id") 
            REFERENCES "public"."amz_users"("id") 
            ON DELETE no action ON UPDATE no action;
        `);
        console.log('✅ Foreign key constraint added.');

        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
}

main();
