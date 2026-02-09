import { db } from '../../src/db';
import { usageHistory } from '../../src/db/schema';
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

        const history = await db.select()
            .from(usageHistory)
            .where(eq(usageHistory.user_id, userId))
            .orderBy(desc(usageHistory.created_at))
            .limit(50);

        return {
            statusCode: 200,
            body: JSON.stringify(history)
        };
    } catch (error: any) {
        console.error('Get Usage History Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', details: error.message }) };
    }
};
