
import { db } from '../../src/db';
import { listings } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
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

        const { id } = JSON.parse(event.body || '{}');

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Listing ID is required' })
            };
        }

        await db.delete(listings)
            .where(and(
                eq(listings.id, Number(id)),
                eq(listings.user_id, userId)
            ));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Listing deleted successfully' })
        };
    } catch (error: any) {
        console.error('Delete Listing Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', message: error.message }) };
    }
};
