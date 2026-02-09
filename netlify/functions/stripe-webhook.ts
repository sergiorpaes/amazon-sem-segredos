
import Stripe from 'stripe';
import { db } from '../../src/db';
import { users, userSubscriptions, plans } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { addCredits } from '../../src/lib/credits';

const getStripe = () => {
    const mode = process.env.STRIPE_MODE || 'TEST';
    const secretKey = mode === 'LIVE' ? process.env.STRIPE_LIVE_SK : process.env.STRIPE_TEST_SK;
    if (!secretKey) throw new Error(`Stripe Secret Key not found for mode: ${mode}`);
    return new Stripe(secretKey, { apiVersion: '2026-01-28.clover' as any }); // Cast to avoid TS issues
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

    console.log(`Processing event: ${stripeEvent.type}`);

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed': {
                const session = stripeEvent.data.object as Stripe.Checkout.Session;
                const metadata = session.metadata || {};
                console.log(`Checkout Metadata:`, metadata);
                const userId = parseInt(metadata.userId);

                if (metadata.type === 'credits') {
                    // One-time credit purchase
                    const amount = parseInt(metadata.creditsAmount || '0');
                    console.log(`Processing Credit Purchase: User=${userId}, Amount=${amount}`);
                    if (amount > 0 && userId) {
                        await addCredits(userId, amount, 'purchased', 'Pacote de Créditos');
                        console.log(`✅ Success: Added ${amount} credits to user ${userId}`);
                    } else {
                        console.warn(`⚠️ Warning: Missing userId (${userId}) or amount (${amount}) in metadata.`);
                    }
                } else if (metadata.type === 'plan') {
                    // New Subscription Created
                    const subscriptionId = session.subscription as string;
                    const planId = parseInt(metadata.planId || '0');

                    if (userId && planId && subscriptionId) {
                        // Create or Update Subscription Record
                        // Check if exists first to avoid duplicate errors if retried
                        const [existing] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.stripe_subscription_id, subscriptionId)).limit(1);

                        // We need the plan to know the limit, but for insertion we just need ID
                        if (!existing) {
                            await db.insert(userSubscriptions).values({
                                user_id: userId,
                                plan_id: planId,
                                stripe_subscription_id: subscriptionId,
                                status: 'active', // Assume active on creation success
                                current_period_end: new Date() // Will be updated by subscription update/invoice
                            });
                            console.log(`Created subscription record for user ${userId}, plan ${planId}`);
                        }
                    }
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = stripeEvent.data.object as any;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    // 1. Try to find our internal subscription record
                    let [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.stripe_subscription_id, subscriptionId)).limit(1);

                    let userId: number | null = sub?.user_id || null;
                    let planId: number | null = sub?.plan_id || null;

                    // 2. Fallback: If not in DB, fetch subscription from Stripe to get metadata
                    if (!userId || !planId) {
                        console.log(`[Webhook] Subscription ${subscriptionId} not found in DB yet. Fetching from Stripe...`);
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        userId = parseInt(subscription.metadata.userId || '0');
                        planId = parseInt(subscription.metadata.planId || '0');
                        console.log(`[Webhook] Fetched metadata from Stripe: User=${userId}, Plan=${planId}`);
                    }

                    if (userId && planId) {
                        // Find the plan details
                        const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);

                        if (plan && plan.credit_limit > 0) {
                            // Grant Monthly Credits
                            // NOTE: We could add idempotency check here based on invoice ID
                            await addCredits(userId, plan.credit_limit, 'monthly', `Plano ${plan.name}`);
                            console.log(`✅ Success: Added monthly credits (${plan.credit_limit}) for user ${userId}`);
                        }

                        // Update subscription status in DB (only if record exists)
                        if (sub) {
                            await db.update(userSubscriptions)
                                .set({ status: 'active' })
                                .where(eq(userSubscriptions.id, sub.id));
                        }
                    } else {
                        console.warn(`⚠️ Warning: Could not resolve userId/planId for subscription ${subscriptionId}`);
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object as any;
                // Update status in DB
                await db.update(userSubscriptions)
                    .set({
                        status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000)
                    })
                    .where(eq(userSubscriptions.stripe_subscription_id, subscription.id));
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = stripeEvent.data.object as Stripe.Subscription;
                // Update status to canceled
                await db.update(userSubscriptions)
                    .set({ status: 'canceled' })
                    .where(eq(userSubscriptions.stripe_subscription_id, subscription.id));
                break;
            }
        }

        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }
};
