import { Handler } from '@netlify/functions';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Verify JWT (Header OR Cookie)
        let token = event.headers.authorization?.replace('Bearer ', '');

        if (!token || token === 'null' || token === 'undefined') {
            const cookies = cookie.parse(event.headers.cookie || '');
            token = cookies.auth_token;
        }

        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

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

        // Get total platform credit usage
        const creditUsageResult = await sql`
            SELECT COALESCE(SUM(credits_spent), 0) as total_spent
            FROM amz_usage_history
        `;
        const totalCreditUsage = parseInt(creditUsageResult[0].total_spent);

        // Get cancellations in the last 30 days (Churn)
        const cancellationsResult = await sql`
            SELECT COUNT(*) as count
            FROM amz_user_subscriptions
            WHERE status = 'canceled' AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
        `;
        const cancellationsLast30d = parseInt(cancellationsResult[0].count);
        const churnRate = activeSubs > 0 ? (cancellationsLast30d / (activeSubs + cancellationsLast30d)) * 100 : 0;

        // Get growth data (last 30 days)
        const signupsPerDay = await sql`
            SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
            FROM amz_users
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY date ASC
        `;

        const cancellationsPerDay = await sql`
            SELECT TO_CHAR(updated_at, 'YYYY-MM-DD') as date, COUNT(*) as count
            FROM amz_user_subscriptions
            WHERE status = 'canceled' AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY TO_CHAR(updated_at, 'YYYY-MM-DD')
            ORDER BY date ASC
        `;

        // Format growth data for the frontend (merge signups and cancellations)
        const growthDataMap: Record<string, { date: string, signups: number, cancellations: number }> = {};

        // Fill last 30 days with zeros
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            growthDataMap[dateStr] = { date: dateStr, signups: 0, cancellations: 0 };
        }

        signupsPerDay.forEach(row => {
            if (growthDataMap[row.date]) growthDataMap[row.date].signups = parseInt(row.count);
        });

        cancellationsPerDay.forEach(row => {
            if (growthDataMap[row.date]) growthDataMap[row.date].cancellations = parseInt(row.count);
        });

        const growthData = Object.values(growthDataMap);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                totalUsers,
                activeSubs,
                monthlyRevenue,
                churnRate: Math.round(churnRate * 10) / 10,
                totalCreditUsage,
                growthData
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
