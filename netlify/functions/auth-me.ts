import { db } from '../../src/db';
import { users, userSubscriptions, plans } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev-key');
        const userId = decoded.userId;

        const [userWithPlan] = await db.select({
            id: users.id,
            email: users.email,
            role: users.role,
            credits_balance: users.credits_balance,
            full_name: users.full_name,
            profile_image: users.profile_image,
            phone: users.phone,
            company_name: users.company_name,
            plan_name: plans.name
        })
            .from(users)
            .leftJoin(userSubscriptions, eq(users.id, userSubscriptions.user_id))
            .leftJoin(plans, eq(userSubscriptions.plan_id, plans.id))
            .where(eq(users.id, userId))
            .orderBy(desc(userSubscriptions.id))
            .limit(1);

        if (!userWithPlan) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(userWithPlan)
        };
    } catch (error: any) {
        console.error('Auth Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Auth Check Failed',
                details: error.message,
                stack: error.stack
            })
        };
    }
};
