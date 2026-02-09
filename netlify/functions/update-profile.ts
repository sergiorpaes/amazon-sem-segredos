import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
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

        const body = JSON.parse(event.body || '{}');
        const { full_name, phone, company_name, profile_image } = body;

        await db.update(users)
            .set({
                full_name,
                phone,
                company_name,
                profile_image,
            })
            .where(eq(users.id, userId));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Profile updated successfully' })
        };
    } catch (error: any) {
        console.error('Update Profile Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', details: error.message }) };
    }
};
