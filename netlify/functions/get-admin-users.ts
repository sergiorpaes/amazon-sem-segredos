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

        if (!token) {
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

        // Get query parameters
        const searchQuery = event.queryStringParameters?.search || '';
        const limit = parseInt(event.queryStringParameters?.limit || '50');
        const offset = parseInt(event.queryStringParameters?.offset || '0');
        const statusFilter = event.queryStringParameters?.status || ''; // 'active', 'trialing', 'past_due', 'canceled'

        if (!process.env.NETLIFY_DATABASE_URL) {
            throw new Error('NETLIFY_DATABASE_URL is not defined');
        }

        // Connect to database
        const sql = neon(process.env.NETLIFY_DATABASE_URL);

        // Build base query
        let query = sql`
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
            WHERE 1=1
        `;

        // Apply filters
        if (searchQuery) {
            query = sql`${query} AND (u.email ILIKE ${`%${searchQuery}%`} OR u.full_name ILIKE ${`%${searchQuery}%`})`;
        }

        if (statusFilter) {
            if (statusFilter === 'delinquent') {
                query = sql`${query} AND us.status IN ('past_due', 'unpaid')`;
            } else {
                query = sql`${query} AND us.status = ${statusFilter}`;
            }
        }

        const users = await sql`${query} ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        // Get total count for pagination with same filters
        let countQuery = sql`SELECT COUNT(*) as count FROM amz_users u LEFT JOIN amz_user_subscriptions us ON u.id = us.user_id WHERE 1=1`;

        if (searchQuery) {
            countQuery = sql`${countQuery} AND (u.email ILIKE ${`%${searchQuery}%`} OR u.full_name ILIKE ${`%${searchQuery}%`})`;
        }
        if (statusFilter) {
            if (statusFilter === 'delinquent') {
                countQuery = sql`${countQuery} AND us.status IN ('past_due', 'unpaid')`;
            } else {
                countQuery = sql`${countQuery} AND us.status = ${statusFilter}`;
            }
        }

        const countResult = await sql`${countQuery}`;
        const totalCount = parseInt(countResult[0].count);
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
