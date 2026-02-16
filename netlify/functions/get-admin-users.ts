import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { users, userSubscriptions, plans } from '../../src/db/schema';
import { eq, or, ilike, desc, and, inArray, sql as drizzleSql } from 'drizzle-orm';
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

        // Get query parameters
        const searchQuery = event.queryStringParameters?.search || '';
        const limit = parseInt(event.queryStringParameters?.limit || '50');
        const offset = parseInt(event.queryStringParameters?.offset || '0');
        const statusFilter = event.queryStringParameters?.status || ''; // 'active', 'trialing', 'past_due', 'canceled', 'delinquent'

        // Build Where Clause
        const filters = [];

        if (searchQuery) {
            filters.push(or(
                ilike(users.email, `%${searchQuery}%`),
                ilike(users.full_name, `%${searchQuery}%`)
            ));
        }

        if (statusFilter) {
            if (statusFilter === 'delinquent') {
                filters.push(inArray(userSubscriptions.status, ['past_due', 'unpaid']));
            } else {
                filters.push(eq(userSubscriptions.status, statusFilter));
            }
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Execute queries
        const [usersData, countResult] = await Promise.all([
            db.select({
                id: users.id,
                email: users.email,
                full_name: users.full_name,
                role: users.role,
                created_at: users.created_at,
                credits_balance: users.credits_balance,
                subscription_status: userSubscriptions.status,
                plan_name: plans.name,
                banned_at: users.banned_at
            })
                .from(users)
                .leftJoin(userSubscriptions, eq(users.id, userSubscriptions.user_id))
                .leftJoin(plans, eq(userSubscriptions.plan_id, plans.id))
                .where(whereClause)
                .orderBy(desc(users.created_at))
                .limit(limit)
                .offset(offset),

            db.select({ count: drizzleSql<number>`count(*)` })
                .from(users)
                .leftJoin(userSubscriptions, eq(users.id, userSubscriptions.user_id))
                .where(whereClause)
        ]);

        const totalCount = Number(countResult[0]?.count || 0);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                users: usersData,
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

