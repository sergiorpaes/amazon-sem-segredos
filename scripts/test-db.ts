import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

async function testDb() {
    console.log('Testing database connection...');
    try {
        const result = await sql`SELECT 1 as result`;
        console.log('Connection successful:', result);

        console.log('Checking amz_plans table...');
        try {
            const plans = await sql`SELECT * FROM amz_plans LIMIT 1`;
            console.log('Plans table exists. First row:', plans);
        } catch (e: any) {
            console.error('Error querying amz_plans:', e.message);
        }

        console.log('Checking amz_user_subscriptions table...');
        try {
            const subs = await sql`SELECT * FROM amz_user_subscriptions LIMIT 1`;
            console.log('Subscriptions table exists. First row:', subs);
        } catch (e: any) {
            console.error('Error querying amz_user_subscriptions:', e.message);
        }

        console.log('Testing admin stats query...');
        try {
            const revenueResult = await sql`
                SELECT COALESCE(SUM(p.monthly_price_eur), 0) as revenue
                FROM amz_user_subscriptions us
                JOIN amz_plans p ON us.plan_id = p.id
                WHERE us.status = 'active'
            `;
            console.log('Admin stats query result:', revenueResult);
        } catch (e: any) {
            console.error('Error running admin stats query:', e.message);
        }

        console.log('Testing today activity query...');
        try {
            const todayActivityResult = await sql`
                SELECT COUNT(*) as count
                FROM amz_users
                WHERE DATE(created_at) = CURRENT_DATE
            `;
            console.log('Today activity query result:', todayActivityResult);
        } catch (e: any) {
            console.error('Error running today activity query:', e.message);
        }

        console.log('Testing get users query...');
        try {
            const users = await sql`
                SELECT 
                    u.id,
                    u.email,
                    u.full_name,
                    u.role,
                    u.created_at,
                    u.credits_balance,
                    us.status as subscription_status,
                    p.name as plan_name
                FROM amz_users u
                LEFT JOIN amz_user_subscriptions us ON u.id = us.user_id
                LEFT JOIN amz_plans p ON us.plan_id = p.id
                ORDER BY u.created_at DESC
                LIMIT 5
            `;
            console.log('Get users query result (first 1):', users.slice(0, 1));
        } catch (e: any) {
            console.error('Error running get users query:', e.message);
        }

    } catch (error: any) {
        console.error('Database connection failed:', error.message);
    }
}

testDb();
