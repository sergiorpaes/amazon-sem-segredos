
import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { systemConfig } from '../../src/db/schema';
import { eq, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event) => {
    // Enable CORS for development
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // GET: Public (or authenticated?) - For now, let's make it public or at least accessible to all logged users.
        // The requirements say "when any user logs in, it must respect these settings".
        // So GET should be accessible.

        if (event.httpMethod === 'GET') {
            const keysToFetch = ['global_features', 'enabled_marketplaces'];
            const results = await db.select().from(systemConfig).where(inArray(systemConfig.key, keysToFetch));

            const config: Record<string, any> = {};
            results.forEach(row => {
                try {
                    config[row.key] = JSON.parse(row.value);
                } catch (e) {
                    config[row.key] = row.value;
                }
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(config)
            };
        }

        // POST: Admin Only
        if (event.httpMethod === 'POST') {
            // 1. Auth & Admin Check
            let token = event.headers.authorization?.replace('Bearer ', '');
            if (!token || token === 'null' || token === 'undefined') {
                const cookies = cookie.parse(event.headers.cookie || '');
                token = cookies.auth_token;
            }

            if (!token) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                if (decoded.role !== 'ADMIN') {
                    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
                }
            } catch (e) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
            }

            // 2. Parse Body & Update
            const body = JSON.parse(event.body || '{}');
            const { key, value } = body;

            if (!key || !value) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing key or value' }) };
            }

            // Validate key
            if (!['global_features', 'enabled_marketplaces'].includes(key)) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid setting key' }) };
            }

            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            // Upsert
            const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);
            if (existing.length > 0) {
                await db.update(systemConfig)
                    .set({ value: stringValue, updated_at: new Date() })
                    .where(eq(systemConfig.key, key));
            } else {
                await db.insert(systemConfig).values({
                    key,
                    value: stringValue,
                    updated_at: new Date()
                });
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Settings updated successfully' })
            };
        }

        return { statusCode: 405, headers, body: 'Method Not Allowed' };

    } catch (error: any) {
        console.error('System Settings API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
