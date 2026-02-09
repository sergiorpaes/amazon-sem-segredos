import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runMigration() {
    try {
        console.log('Running migration: add cancel_at_period_end column...');

        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.NETLIFY_DATABASE_URL!);

        await sql`
            ALTER TABLE amz_user_subscriptions 
            ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
        `;

        console.log('✅ Migration completed successfully!');
        console.log('Column cancel_at_period_end added to amz_user_subscriptions table.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

runMigration();
