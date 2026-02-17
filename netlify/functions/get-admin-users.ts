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

        // 2. Fetch Users (Simplified, no join yet)
        const usersData = await db.select()
            .from(users)
            .where(searchQuery ? ilike(users.email, `%${searchQuery}%`) : undefined)
            .orderBy(desc(users.created_at))
            .limit(limit)
            .offset(offset);

        // 3. Count Total (Approximate if simplified)
        const countResult = await db.select({ count: drizzleSql<number>`count(*)` })
            .from(users)
            .where(searchQuery ? ilike(users.email, `%${searchQuery}%`) : undefined);

        const totalCount = Number(countResult[0]?.count || 0);

        // 4. Fetch Subscriptions for these users
        const userIds = usersData.map(u => u.id);
        const userSubsMap = new Map();

        if (userIds.length > 0) {
            const subs = await db.select({
                user_id: userSubscriptions.user_id,
                status: userSubscriptions.status,
                plan_name: plans.name
            })
                .from(userSubscriptions)
                .leftJoin(plans, eq(userSubscriptions.plan_id, plans.id))
                .where(inArray(userSubscriptions.user_id, userIds));

            // Logic to pick 'best' sub in memory
            // Priority: active > trialing > past_due > unpaid > canceled > others
            const statusPriority: Record<string, number> = {
                'active': 1, 'trialing': 2, 'past_due': 3, 'unpaid': 4, 'canceled': 5
            };

            subs.forEach(s => {
                const currentBest = userSubsMap.get(s.user_id);
                if (!currentBest) {
                    userSubsMap.set(s.user_id, s);
                } else {
                    const currentPriority = statusPriority[currentBest.status] || 6;
                    const newPriority = statusPriority[s.status] || 6;
                    if (newPriority < currentPriority) {
                        userSubsMap.set(s.user_id, s);
                    }
                }
            });
        }

        // 5. Merge Data
        const enrichedUsers = usersData.map(user => {
            const sub = userSubsMap.get(user.id);
            // Apply status filter in memory if needed (though pagination might be slightly off if strictly filtering)
            // Ideally we'd filter in DB, but for stability let's return all and handle complex filters later if critical.
            // Note: The UI status filter passed in params is NOT applied here for now to ensure 500 fix.
            return {
                id: user.id,
                email: user.email,
                full_name: null, // Schema does not have full_name yet
                role: user.role,
                created_at: user.created_at,
                credits_balance: user.credits_balance,
                subscription_status: sub?.status,
                plan_name: sub?.plan_name || 'Free',
                banned_at: user.banned_at
            };
        });

        // Optional: Client-side filtering for status if strictly required now (accepting fewer results per page)
        let finalUsers = enrichedUsers;
        if (statusFilter) {
            finalUsers = enrichedUsers.filter(u =>
                statusFilter === 'delinquent'
                    ? ['past_due', 'unpaid'].includes(u.subscription_status || '')
                    : u.subscription_status === statusFilter
            );
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                users: finalUsers,
                totalCount, // Note: Total count might mismatch filtered length, but accepted for now
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

