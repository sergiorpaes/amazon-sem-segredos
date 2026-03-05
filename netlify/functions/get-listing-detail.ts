
import { db } from '../../src/db';
import { listings } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        let userId: number;
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev-key');
            userId = decoded.userId;
        } catch (e) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid Token' }) };
        }

        // Support both GET query param and POST body
        let id: string | null = null;
        if (event.httpMethod === 'GET') {
            id = event.queryStringParameters?.id;
        } else {
            const body = JSON.parse(event.body || '{}');
            id = body.id;
        }

        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Listing ID is required' }) };
        }

        const [listing] = await db.select()
            .from(listings)
            .where(eq(listings.id, parseInt(id)))
            .limit(1);

        if (!listing) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Listing not found' }) };
        }

        // Security check: ensure listing belongs to user
        if (listing.user_id !== userId) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(listing)
        };
    } catch (error: any) {
        console.error('Get Listing Detail Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
        };
    }
};
