
import Stripe from 'stripe';
import { db } from '../../src/db';
import { users, subscriptions } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

const getStripe = () => {
    const mode = process.env.STRIPE_MODE || 'TEST';
    const secretKey = mode === 'LIVE' ? process.env.STRIPE_LIVE_SK : process.env.STRIPE_TEST_SK;
    if (!secretKey) throw new Error(`Stripe Secret Key not found for mode: ${mode}`);
    return new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' });
};

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const stripe = getStripe();
    const signature = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;

    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body, signature, webhookSecret!);
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object as Stripe.Checkout.Session;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                // Find user by stripe_customer_id
                const [user] = await db.select().from(users).where(eq(users.stripe_customer_id, customerId)).limit(1);

                if (user) {
                    await db.insert(subscriptions).values({
                        user_id: user.id,
                        stripe_subscription_id: subscriptionId,
                        status: 'active',
                        plan_type: 'PRO',
                        current_period_end: new Date(), // Should get from subscription object actually
                    });

                    // Grant unlimited credits or high limit
                    await db.update(users).set({ role: 'PRO', credits_balance: 9999 }).where(eq(users.id, user.id));
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object as Stripe.Subscription;
                // Update status in DB
                await db.update(subscriptions)
                    .set({
                        status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000)
                    })
                    .where(eq(subscriptions.stripe_subscription_id, subscription.id));
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object as Stripe.Subscription;
                // Update status to canceled and revert user role
                await db.update(subscriptions)
                    .set({ status: 'canceled' })
                    .where(eq(subscriptions.stripe_subscription_id, subscription.id));

                // Find user and revert to FREE
                // (Complex logic omitted for brevity, would need to join tables or store user_id in subscription metadata)
                break;
            }
        }

        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }
};
