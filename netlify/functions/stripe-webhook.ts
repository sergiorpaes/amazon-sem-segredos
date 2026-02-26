
import Stripe from 'stripe';
import { db } from '../../src/db';
import { users, userSubscriptions, plans, systemConfig, creditsLedger } from '../../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
    // Fetch Global Settings for Stripe Mode
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, 'stripe_mode')).limit(1);
    const mode = config?.value || process.env.STRIPE_MODE || 'TEST';

    const webhookSecret = mode === 'LIVE'
        ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
        : (process.env.STRIPE_TEST_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET);

    if (!webhookSecret) {
        console.error(`Webhook Secret not found for mode: ${mode}`);
        return { statusCode: 500, body: 'Webhook Secret Configuration Error' };
    }

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
                            // Cancel any previous active subscriptions in our DB for this user
                            await db.update(userSubscriptions)
                                .set({ status: 'canceled' })
                                .where(and(
                                    eq(userSubscriptions.user_id, userId),
                                    eq(userSubscriptions.status, 'active')
                                ));

                            await db.insert(userSubscriptions).values({
                                user_id: userId,
                                plan_id: planId,
                                stripe_subscription_id: subscriptionId,
                                status: 'active',
                                current_period_end: new Date()
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
                    console.log(`[Webhook] Invoice Payment Succeeded for Subscription: ${subscriptionId}`);
                    // ALWAYS fetch subscription from Stripe to ensure we have the absolute latest metadata (handles upgrades)
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
                    let userId = parseInt(subscription.metadata.userId || invoice.metadata?.userId || '0');
                    let planId = parseInt(subscription.metadata.planId || invoice.metadata?.planId || '0');

                    // If metadata still missing, fallback to our database
                    if (!userId || !planId) {
                        const [subDb] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.stripe_subscription_id, subscriptionId)).limit(1);
                        if (subDb) {
                            userId = userId || subDb.user_id;
                            planId = planId || subDb.plan_id;
                        }
                    }

                    console.log(`[Webhook] Subscription Metadata: User=${userId}, Plan=${planId}`);

                    if (userId && planId) {
                        // 1. Sync internal subscription record (UPSERT)
                        const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.stripe_subscription_id, subscriptionId)).limit(1);

                        if (sub) {
                            await db.update(userSubscriptions)
                                .set({ plan_id: planId, status: 'active' })
                                .where(eq(userSubscriptions.id, sub.id));
                        } else {
                            // Rare case: invoice arrives before checkout.session.completed
                            await db.insert(userSubscriptions).values({
                                user_id: userId,
                                plan_id: planId,
                                stripe_subscription_id: subscriptionId,
                                status: 'active',
                                current_period_end: new Date(subscription.current_period_end * 1000)
                            });
                        }

                        // 2. Grant Plan Credits
                        const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
                        if (plan && plan.credit_limit > 0) {
                            const [existingLedger] = await db.select().from(creditsLedger).where(
                                and(
                                    eq(creditsLedger.user_id, userId),
                                    eq(creditsLedger.type, 'monthly'),
                                    eq(creditsLedger.description, `Plano ${plan.name} (${invoice.id})`)
                                )
                            ).limit(1);

                            if (!existingLedger) {
                                await addCredits(userId, plan.credit_limit, 'monthly', `Plano ${plan.name} (${invoice.id})`);
                                console.log(`✅ Success: Added monthly credits (${plan.credit_limit}) for user ${userId} (Plan: ${plan.name})`);
                            } else {
                                console.log(`⏩ Skipped: Credits already granted for invoice ${invoice.id}`);
                            }
                        }
                    } else {
                        console.warn(`⚠️ Warning: Missing metadata on subscription ${subscriptionId}. No credits granted.`);
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = stripeEvent.data.object as any;
                const planId = parseInt(subscription.metadata.planId || '0');

                // Update status, cancellation info AND plan_id in case of upgrade/downgrade
                const updateData: any = {
                    status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000),
                    cancel_at_period_end: subscription.cancel_at_period_end || false
                };

                if (planId > 0) {
                    updateData.plan_id = planId;
                }

                await db.update(userSubscriptions)
                    .set(updateData)
                    .where(eq(userSubscriptions.stripe_subscription_id, subscription.id));

                console.log(`[Webhook] Subscription Updated: ${subscription.id}, Status: ${subscription.status}, PlanId: ${planId}`);
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
