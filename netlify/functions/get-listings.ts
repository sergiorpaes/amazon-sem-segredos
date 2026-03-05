
import { db } from '../../src/db';
import { listings } from '../../src/db/schema';
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

        const userListings = await db.select({
            id: listings.id,
            user_id: listings.user_id,
            product_name: listings.product_name,
            listing_data: listings.listing_data,
            created_at: listings.created_at
        })
            .from(listings)
            .where(eq(listings.user_id, userId))
            .orderBy(desc(listings.created_at))
            .limit(50);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(userListings)
        };
    } catch (error: any) {
        console.error('Get Listings Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', message: error.message }) };
    }
};
