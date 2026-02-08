
import Stripe from 'stripe';
import { db } from '../../src/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// Helper to get Stripe instance based on mode
const getStripe = () => {
    const mode = process.env.STRIPE_MODE || 'TEST';
    const secretKey = mode === 'LIVE' ? process.env.STRIPE_LIVE_SK : process.env.STRIPE_TEST_SK;
    if (!secretKey) throw new Error(`Stripe Secret Key not found for mode: ${mode}`);
    return new Stripe(secretKey, { apiVersion: '2026-01-28.clover' as any }); // Cast to any to avoid future type mismatches if versioning changes
};

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Verify Auth
    const cookies = cookie.parse(event.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev-key');
        const userId = decoded.userId;

        // Support both POST body and GET query (for simple links)
        const body = event.body ? JSON.parse(event.body) : {};
        const query = event.queryStringParameters || {};

        const type = body.type || query.type || 'plan'; // 'plan' or 'credits'
        const stripe = getStripe();

        // Get User
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        let customerId = user.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id.toString() }
            });
            customerId = customer.id;
            await db.update(users).set({ stripe_customer_id: customerId }).where(eq(users.id, userId));
        }

        let session;
        const SUCCESS_URL = `${process.env.URL || 'http://localhost:8888'}/dashboard?success=true`;
        const CANCEL_URL = `${process.env.URL || 'http://localhost:8888'}/dashboard?canceled=true`;

        if (type === 'credits') {
            // One-time payment for credits
            const priceId = process.env.STRIPE_CREDITS_PRICE_ID || 'price_placeholder_credits';
            session = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'payment',
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: SUCCESS_URL,
                cancel_url: CANCEL_URL,
                metadata: { userId: user.id.toString(), type: 'credits' }
            });
        } else {
            // Subscription for plan
            const priceId = body.priceId || query.priceId || process.env.STRIPE_PRO_PLAN_ID || 'price_placeholder_pro';
            session = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: SUCCESS_URL,
                cancel_url: CANCEL_URL,
                metadata: { userId: user.id.toString(), type: 'plan' }
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url })
        };

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal Server Error' }) };
    }
};
