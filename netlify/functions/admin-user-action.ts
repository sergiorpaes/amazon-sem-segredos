import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { users, userSubscriptions, creditsLedger, plans } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { addCredits } from '../../src/lib/credits';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Verify Authentication & Authorization
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

        // 2. Parse Request Body
        const { userId, action, payload } = JSON.parse(event.body || '{}');
        if (!userId || !action) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId or action' }) };
        }

        // 3. Handle Actions
        switch (action) {
            case 'UPDATE_CREDITS': {
                const { amount, description } = payload;
                await addCredits(Number(userId), Number(amount), 'purchased', description || 'Admin manually adjusted credits');
                break;
            }

            case 'CHANGE_PLAN': {
                const { planId } = payload;
                // Check if user has a subscription record
                const existingSub = await db.select().from(userSubscriptions).where(eq(userSubscriptions.user_id, userId)).limit(1);

                if (existingSub.length > 0) {
                    await db.update(userSubscriptions)
                        .set({ plan_id: Number(planId), updated_at: new Date() })
                        .where(eq(userSubscriptions.user_id, userId));
                } else {
                    await db.insert(userSubscriptions).values({
                        user_id: Number(userId),
                        plan_id: Number(planId),
                        status: 'active',
                    });
                }
                break;
            }

            case 'RESET_PASSWORD': {
                const { newPassword } = payload;
                const passwordHash = await bcrypt.hash(newPassword, 10);
                await db.update(users)
                    .set({ password_hash: passwordHash })
                    .where(eq(users.id, userId));
                break;
            }

            case 'SET_BANNED_STATUS': {
                const { banned } = payload;
                await db.update(users)
                    .set({ banned_at: banned ? new Date() : null })
                    .where(eq(users.id, userId));
                break;
            }

            case 'DELETE_USER': {
                // For safety, maybe just ban? But if user asks for delete:
                // We should probably delete related records first or just soft delete.
                // Let's implement soft delete (ban) for now or full delete if requested.
                // Re-reading: the user didn't explicitly ask for delete, but action menu often has it.
                // The prompt says "Suspend/Ban Account". So SET_BANNED_STATUS covers it.
                break;
            }

            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Action processed successfully' })
        };

    } catch (error: any) {
        console.error('Admin Action Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
