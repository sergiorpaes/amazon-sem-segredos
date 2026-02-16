import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { systemConfig, plans } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event) => {
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
        if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') {
            return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
        }

        const { type, payload } = JSON.parse(event.body || '{}');

        if (type === 'UPDATE_PLAN') {
            const { planId, monthly_price_eur, credit_limit } = payload;
            await db.update(plans)
                .set({
                    monthly_price_eur: Number(monthly_price_eur),
                    credit_limit: Number(credit_limit),
                    created_at: new Date() // Just to trigger update if needed, though updated_at would be better
                })
                .where(eq(plans.id, planId));
        } else if (type === 'UPDATE_CONFIG') {
            const { key, value } = payload;

            const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, key)).limit(1);

            if (existing.length > 0) {
                await db.update(systemConfig)
                    .set({ value: String(value), updated_at: new Date() })
                    .where(eq(systemConfig.key, key));
            } else {
                await db.insert(systemConfig).values({
                    key,
                    value: String(value),
                    updated_at: new Date()
                });
            }
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid config type' }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Configuration updated' })
        };

    } catch (error: any) {
        console.error('Update Config Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
