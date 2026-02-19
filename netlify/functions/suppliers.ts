
import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { suppliers, users } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const handler: Handler = async (event, context) => {
    // Enable CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            }
        };
    }

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    // Helper: Verify Admin Token
    const verifyAdmin = async () => {
        const authHeader = event.headers.authorization;
        if (!authHeader) throw new Error('No token provided');

        const token = authHeader.replace('Bearer ', '');
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            // Check if user is actually admin in DB
            const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
            if (!user[0] || user[0].role !== 'ADMIN') {
                throw new Error('Unauthorized');
            }
            return user[0];
        } catch (err) {
            throw new Error('Invalid token');
        }
    };

    try {
        switch (event.httpMethod) {
            case 'GET':
                // Public endpoint (can be protected if needed, but usually public for users)
                const allSuppliers = await db.select().from(suppliers).orderBy(desc(suppliers.featured), desc(suppliers.created_at));
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(allSuppliers)
                };

            case 'POST':
                await verifyAdmin();
                const newSupplierData = JSON.parse(event.body || '{}');

                // Basic validation
                if (!newSupplierData.name || !newSupplierData.url) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name and URL are required' }) };
                }

                const [created] = await db.insert(suppliers).values({
                    name: newSupplierData.name,
                    url: newSupplierData.url,
                    categories: newSupplierData.categories || [],
                    description: newSupplierData.description,
                    country: newSupplierData.country,
                    featured: newSupplierData.featured || false,
                    created_at: new Date()
                }).returning();

                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify(created)
                };

            case 'PUT':
                await verifyAdmin();
                const updateData = JSON.parse(event.body || '{}');
                const updateId = updateData.id;

                if (!updateId) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID is required' }) };
                }

                const [updated] = await db.update(suppliers)
                    .set({
                        name: updateData.name,
                        url: updateData.url,
                        categories: updateData.categories,
                        description: updateData.description,
                        country: updateData.country,
                        featured: updateData.featured
                    })
                    .where(eq(suppliers.id, updateId))
                    .returning();

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(updated)
                };

            case 'DELETE':
                await verifyAdmin();
                const deleteId = event.queryStringParameters?.id;

                if (!deleteId) {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID is required' }) };
                }

                await db.delete(suppliers).where(eq(suppliers.id, parseInt(deleteId)));

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'Deleted successfully' })
                };

            default:
                return { statusCode: 405, headers, body: 'Method Not Allowed' };
        }
    } catch (error: any) {
        console.error('API Error:', error);
        return {
            statusCode: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
