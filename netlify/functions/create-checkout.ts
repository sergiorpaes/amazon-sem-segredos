
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
    return new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' }); // Use latest API version or pin
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

        const { priceId } = JSON.parse(event.body);
        if (!priceId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Price ID required' }) };
        }

        const stripe = getStripe();

        // Get or Create Stripe Customer
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

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.URL}/dashboard?success=true`,
            cancel_url: `${process.env.URL}/dashboard?canceled=true`,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url })
        };

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};
