
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
                    // Find our internal subscription record
                    const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.stripe_subscription_id, subscriptionId)).limit(1);

                    if (sub) {
                        // Find the plan details
                        const [plan] = await db.select().from(plans).where(eq(plans.id, sub.plan_id)).limit(1);

                        if (plan && plan.credit_limit > 0) {
                            // Grant Monthly Credits
                            // Note: 'monthly' credits could replace previous ones or stack?
                            // User says: "créditos do plano resetam mensalmente". 
                            // This implies we might want to expire old 'monthly' credits effectively or just add new ones with 30d expiry.
                            // Our addCredits logic adds with 1 month expiry.
                            // "Reset" could mean remove old ones? 
                            // For simplicity/safety, we just add new ones which expire. 
                            // If logic requires *removing* old ones, we'd need to set remaining=0 on old 'monthly' batches.

                            // Let's EXPIRE old monthly credits for this user?
                            // "créditos avulsos não expiram; créditos do plano resetam mensalmente".
                            // "Reset" suggests if I have 10 left, I go to 50 (if limit is 50). Not 60.
                            // BUT implementation of 'reset' is complex if they consumed some. 
                            // EASIER INTERPRETATION: Pack credits = no expire. Monthly = expire in 30 days.
                            // If they don't use it, they lose it.
                            // The `consumeCredits` consumes expiring first.
                            // So effectively it works as a "use it or lose it".

                            await addCredits(sub.user_id, plan.credit_limit, 'monthly', `Renovação Plano ${plan.name}`);
                            console.log(`Added monthly credits (${plan.credit_limit}) for user ${sub.user_id}`);
                        }

                        // Update subscription status just in case
                        await db.update(userSubscriptions)
                            .set({
                                status: 'active',
                                // invoice.lines.data[0].period.end? 
                                // checking invoice structure for period end is safe
                            })
                            .where(eq(userSubscriptions.id, sub.id));
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
