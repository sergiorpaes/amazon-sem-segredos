
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
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

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        // Return safe user data
        const { password_hash, ...safeUser } = user;

        return {
            statusCode: 200,
            body: JSON.stringify(safeUser)
        };
    } catch (error: any) {
        console.error('Auth Error:', error);
        return { statusCode: 401, body: JSON.stringify({ error: 'Invalid Token' }) };
    }
};
