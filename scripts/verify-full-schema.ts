
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

async function verifySchema() {
    console.log('🔍 Verifying schema...');

    const tables = [
        'amz_credits_ledger',
        'amz_usage_history',
        'amz_user_subscriptions',
        'amz_generations'
    ];

    for (const table of tables) {
        const result = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = ${table}
            );
        `;
        const exists = result[0].exists;
        console.log(`${exists ? '✅' : '❌'} Table '${table}' ${exists ? 'exists' : 'MISSING'}`);
    }

    process.exit(0);
}

verifySchema();
