
import { db } from '../../src/db';
import { listings } from '../../src/db/schema';
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
        const { productName, listingData, generatedImages } = body;

        if (!productName || !listingData) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'productName and listingData are required' })
            };
        }

        const [newListing] = await db.insert(listings).values({
            user_id: userId,
            product_name: productName,
            listing_data: listingData,
            generated_images: generatedImages || [] // Now saving images as requested
        }).returning();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(newListing)
        };
    } catch (error: any) {
        console.error('Save Listing Error FULL:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                details: error.toString()
            })
        };
    }
};
