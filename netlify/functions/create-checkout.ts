
import Stripe from 'stripe';
import { db } from '../../src/db';
import { users, plans } from '../../src/db/schema';
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

        const CREDIT_PACKS: Record<string, { priceId: string, credits: number }> = {
            'micro': { priceId: process.env.STRIPE_PRICE_MICRO || '', credits: 20 },
            'business': { priceId: process.env.STRIPE_PRICE_BUSINESS || '', credits: 100 },
            'bulk': { priceId: process.env.STRIPE_PRICE_BULK || '', credits: 300 }
        };

        if (type === 'credits') {
            // One-time payment for credits
            let priceId = body.priceId;
            let creditsAmount = 0;

            if (body.pack && CREDIT_PACKS[body.pack]) {
                priceId = CREDIT_PACKS[body.pack].priceId;
                creditsAmount = CREDIT_PACKS[body.pack].credits;

                if (!priceId) {
                    throw new Error(`Configuração do Stripe ausente para o pacote: ${body.pack}. Verifique as variáveis de ambiente.`);
                }
            } else {
                // Fallback or specific priceId passed
                priceId = priceId || process.env.STRIPE_CREDITS_PRICE_ID || '';
                if (!priceId) {
                    throw new Error("ID de Preço de créditos não configurado. Verifique STRIPE_CREDITS_PRICE_ID.");
                }
            }

            session = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'payment',
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: SUCCESS_URL,
                cancel_url: CANCEL_URL,
                metadata: {
                    userId: user.id.toString(),
                    type: 'credits',
                    creditsAmount: creditsAmount.toString()
                }
            });
        } else {
            // Subscription for plan
            let priceId = body.priceId || query.priceId;
            let planId = body.planId || query.planId;

            // If we have a priceId but no planId, try to find the plan
            if (priceId && !planId) {
                const [plan] = await db.select().from(plans).where(eq(plans.stripe_price_id, priceId)).limit(1);
                if (plan) planId = plan.id;
            }

            // If no priceId or it's a placeholder, but we have a planId, resolve it
            if ((!priceId || priceId.includes('placeholder')) && planId) {
                const [plan] = await db.select().from(plans).where(eq(plans.id, parseInt(planId))).limit(1);
                if (plan) {
                    if (plan.stripe_price_id && !plan.stripe_price_id.includes('placeholder')) {
                        priceId = plan.stripe_price_id;
                    } else if (plan.stripe_product_id) {
                        // Resolve Price ID from Product ID dynamically
                        console.log(`Resolvendo Price ID para Produto: ${plan.stripe_product_id}`);
                        const prices = await stripe.prices.list({
                            product: plan.stripe_product_id,
                            active: true,
                            limit: 1
                        });
                        if (prices.data.length > 0) {
                            priceId = prices.data[0].id;
                            // Cache it back to DB for performance
                            await db.update(plans).set({ stripe_price_id: priceId }).where(eq(plans.id, plan.id));
                        }
                    }
                }
            }

            // Fallback if still no valid priceId (Default to Pro)
            if (!priceId || priceId.includes('placeholder')) {
                const PRO_ENV_ID = process.env.STRIPE_PRO_PLAN_ID;
                if (PRO_ENV_ID && !PRO_ENV_ID.includes('placeholder')) {
                    priceId = PRO_ENV_ID;
                } else {
                    const [proPlan] = await db.select().from(plans).where(eq(plans.name, 'Pro')).limit(1);
                    if (proPlan?.stripe_price_id && !proPlan.stripe_price_id.includes('placeholder')) {
                        priceId = proPlan.stripe_price_id;
                    }
                }

                if (!priceId || priceId.includes('placeholder')) {
                    throw new Error("Plano Pro não configurado corretamente no Stripe.");
                }

                if (!planId && priceId) {
                    const [plan] = await db.select().from(plans).where(eq(plans.stripe_price_id, priceId)).limit(1);
                    if (plan) planId = plan.id;
                }
            }

            session = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: SUCCESS_URL,
                cancel_url: CANCEL_URL,
                metadata: {
                    userId: user.id.toString(),
                    type: 'plan',
                    planId: planId ? planId.toString() : ''
                }
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
