import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { systemConfig, plans } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event) => {
    console.log('[update-admin-config] Starting request');
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Auth check
        let token = event.headers.authorization?.replace('Bearer ', '');
        if (!token || token === 'null' || token === 'undefined') {
            const cookies = cookie.parse(event.headers.cookie || '');
            token = cookies.auth_token;
        }
        if (!token) {
            console.log('[update-admin-config] No token found');
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') {
            console.log('[update-admin-config] User is not ADMIN');
            return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
        }

        const body = JSON.parse(event.body || '{}');
        const { type, payload } = body;
        console.log('[update-admin-config] Type:', type, 'Payload:', JSON.stringify(payload));

        if (type === 'UPDATE_PLAN') {
            const { planId, monthly_price_eur, credit_limit } = payload;
            console.log('[update-admin-config] Updating plan:', planId);
            await db.update(plans)
                .set({
                    monthly_price_eur: Number(monthly_price_eur),
                    credit_limit: Number(credit_limit),
                    created_at: new Date()
                })
                .where(eq(plans.id, planId));
        } else if (type === 'UPDATE_CONFIG') {
            const { key, value } = payload;
            console.log('[update-admin-config] Updating config:', key, '=', value);

            try {
                const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);

                if (existing.length > 0) {
                    console.log('[update-admin-config] Found existing config, updating...');
                    await db.update(systemConfig)
                        .set({ value: String(value), updated_at: new Date() })
                        .where(eq(systemConfig.key, key));
                } else {
                    console.log('[update-admin-config] No existing config, inserting...');
                    await db.insert(systemConfig).values({
                        key,
                        value: String(value),
                        updated_at: new Date()
                    });
                }
            } catch (dbError: any) {
                console.error('[update-admin-config] Database operation failed:', dbError);
                throw new Error(`Database operation failed: ${dbError.message}. Does the amz_system_config table exist?`);
            }
        } else {
            console.log('[update-admin-config] Invalid config type:', type);
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid config type' }) };
        }

        console.log('[update-admin-config] Success!');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Configuration updated' })
        };

    } catch (error: any) {
        console.error('Update Config Error:', error);

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid or expired token', details: error.message })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
