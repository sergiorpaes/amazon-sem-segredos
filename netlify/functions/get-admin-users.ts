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

        // Get query parameters
        const searchQuery = event.queryStringParameters?.search || '';
        const limit = parseInt(event.queryStringParameters?.limit || '50');
        const offset = parseInt(event.queryStringParameters?.offset || '0');

        // Connect to database
        const sql = neon(process.env.NETLIFY_DATABASE_URL!);

        // Build query with optional search
        let users;
        if (searchQuery) {
            users = await sql`
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
                WHERE u.email ILIKE ${`%${searchQuery}%`} 
                   OR u.full_name ILIKE ${`%${searchQuery}%`}
                ORDER BY u.created_at DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `;
        } else {
            users = await sql`
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
                LIMIT ${limit}
                OFFSET ${offset}
            `;
        }

        // Get total count for pagination
        const countResult = await sql`
            SELECT COUNT(*) as count FROM amz_users
        `;
        const totalCount = parseInt(countResult[0].count);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                users,
                totalCount,
                limit,
                offset
            })
        };
    } catch (error: any) {
        console.error('Error fetching admin users:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
