import { db } from '../../src/db';
import { userSubscriptions } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Authenticate user
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev-key');
        const userId = decoded.userId;

        // Find active subscription
        const [subscription] = await db.select()
            .from(userSubscriptions)
            .where(and(
                eq(userSubscriptions.user_id, userId),
                eq(userSubscriptions.status, 'active')
            ))
            .limit(1);

        if (!subscription) {
            return {
                statusCode: 200,
                body: JSON.stringify({ subscription: null })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: subscription.current_period_end ? Math.floor(subscription.current_period_end.getTime() / 1000) : null,
                status: subscription.status
            })
        };
    } catch (error: any) {
        console.error('Get Subscription Info Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
