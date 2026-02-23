
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

        console.log(`[SaveListing] Attempting to save for user ${userId}, product: ${productName}, images count: ${generatedImages?.length || 0}`);

        if (!productName || !listingData) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'productName and listingData are required' })
            };
        }

        try {
            const [newListing] = await db.insert(listings).values({
                user_id: userId,
                product_name: productName,
                listing_data: listingData,
                generated_images: generatedImages || []
            }).returning();

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(newListing)
            };
        } catch (dbError: any) {
            console.error('Database Insertion Error:', dbError);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Database Error',
                    message: dbError.message,
                    detail: dbError.detail || 'Failed to insert into database'
                })
            };
        }
    } catch (error: any) {
        console.error('General Save Listing Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            })
        };
    }
};
