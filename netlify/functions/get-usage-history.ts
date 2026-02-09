import { db } from '../../src/db';
import { usageHistory, creditsLedger } from '../../src/db/schema';
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

        const historyItems = await db.select().from(usageHistory).where(eq(usageHistory.user_id, userId));
        const ledgerItems = await db.select().from(creditsLedger).where(eq(creditsLedger.user_id, userId));

        const unified = [
            ...historyItems.map(item => ({
                id: `u-${item.id}`,
                type: 'usage',
                label: item.feature_used,
                amount: -item.credits_spent,
                created_at: item.created_at,
                metadata: item.metadata
            })),
            ...ledgerItems.map(item => ({
                id: `l-${item.id}`,
                type: 'grant',
                label: item.description,
                amount: item.amount,
                created_at: item.created_at
            }))
        ].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

        return {
            statusCode: 200,
            body: JSON.stringify(unified.slice(0, 50))
        };
    } catch (error: any) {
        console.error('Get Usage History Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', details: error.message }) };
    }
};
