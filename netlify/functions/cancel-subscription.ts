import Stripe from 'stripe';
import { db } from '../../src/db';
import { userSubscriptions } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const getStripe = () => {
    const mode = process.env.STRIPE_MODE || 'TEST';
    const secretKey = mode === 'LIVE' ? process.env.STRIPE_LIVE_SK : process.env.STRIPE_TEST_SK;
    if (!secretKey) throw new Error(`Stripe Secret Key not found for mode: ${mode}`);
    return new Stripe(secretKey, { apiVersion: '2026-01-28.clover' as any });
};

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Authenticate user
        const cookies = cookie.parse(event.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev-key');
        const userId = decoded.userId;

        // 2. Find active subscription
        const [subscription] = await db.select()
            .from(userSubscriptions)
            .where(and(
                eq(userSubscriptions.user_id, userId),
                eq(userSubscriptions.status, 'active')
            ))
            .limit(1);

        if (!subscription) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No active subscription found' })
            };
        }

        // 3. Cancel subscription in Stripe (at period end)
        const stripe = getStripe();
        const updatedSubscription = await stripe.subscriptions.update(
            subscription.stripe_subscription_id!,
            { cancel_at_period_end: true }
        );

        console.log(`Subscription ${subscription.stripe_subscription_id} set to cancel at period end`);

        // 4. Return success with period end date
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Subscription will be canceled at the end of the billing period',
                cancel_at: updatedSubscription.cancel_at,
                current_period_end: updatedSubscription.current_period_end
            })
        };
    } catch (error: any) {
        console.error('Cancel Subscription Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
