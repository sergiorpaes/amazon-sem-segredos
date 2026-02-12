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

        // Connect to database
        const sql = neon(process.env.NETLIFY_DATABASE_URL!);

        // Get recent 5 users
        const recentUsers = await sql`
            SELECT 
                u.email,
                u.role,
                u.created_at,
                us.status as subscription_status
            FROM amz_users u
            LEFT JOIN amz_user_subscriptions us ON u.id = us.user_id
            ORDER BY u.created_at DESC
            LIMIT 5
        `;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recentUsers)
        };
    } catch (error: any) {
        console.error('Error fetching recent users:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
