import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Verify JWT and check admin role
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.role !== 'ADMIN') {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Forbidden - Admin access required' })
            };
        }

        if (!process.env.NETLIFY_DATABASE_URL) {
            throw new Error('NETLIFY_DATABASE_URL is not defined');
        }

        // Connect to database
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Get total users count
        const totalUsersResult = await sql`
            SELECT COUNT(*) as count FROM amz_users
        `;
        const totalUsers = parseInt(totalUsersResult[0].count);

        // Get active subscriptions count
        const activeSubsResult = await sql`
            SELECT COUNT(*) as count 
            FROM amz_user_subscriptions 
            WHERE status = 'active'
        `;
        const activeSubs = parseInt(activeSubsResult[0].count);

        // Calculate monthly revenue (sum of active subscription prices)
        const revenueResult = await sql`
            SELECT COALESCE(SUM(p.monthly_price_eur), 0) as revenue
            FROM amz_user_subscriptions us
            JOIN amz_plans p ON us.plan_id = p.id
            WHERE us.status = 'active'
        `;
        const monthlyRevenue = parseFloat(revenueResult[0].revenue) / 100; // Convert cents to euros

        // Get today's activity count (you can customize this query)
        // For now, let's count users created today
        const todayActivityResult = await sql`
            SELECT COUNT(*) as count
            FROM amz_users
            WHERE DATE(created_at) = CURRENT_DATE
        `;
        const generationsToday = parseInt(todayActivityResult[0].count);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                totalUsers,
                activeSubs,
                monthlyRevenue,
                generationsToday
            })
        };
    } catch (error: any) {
        console.error('Error fetching admin stats:', error);

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid or expired token', details: error.message })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
