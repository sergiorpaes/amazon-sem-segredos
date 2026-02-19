
import Stripe from 'stripe';
import { db } from '../../src/db';
import { users, plans, systemConfig } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// Helper to get Stripe instance based on mode
const getStripe = (mode: string) => {
    const secretKey = mode === 'LIVE' ? process.env.STRIPE_LIVE_SK : process.env.STRIPE_TEST_SK;
    if (!secretKey) throw new Error(`Stripe Secret Key not found for mode: ${mode}`);
    return new Stripe(secretKey, { apiVersion: '2026-01-28.clover' as any });
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

        // Fetch Global Settings
        const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, 'stripe_mode')).limit(1);
        const stripeMode = config?.value || process.env.STRIPE_MODE || 'TEST';

        // Support both POST body and GET query
        const body = event.body ? JSON.parse(event.body) : {};
        const query = event.queryStringParameters || {};

        const type = body.type || query.type || 'plan';
        const stripe = getStripe(stripeMode);

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

        const getPriceId = (key: string) => {
            if (stripeMode === 'LIVE') {
                return process.env[`STRIPE_LIVE_PRICE_${key}`] || process.env[`STRIPE_PRICE_${key}`] || '';
            }
            return process.env[`STRIPE_TEST_PRICE_${key}`] || process.env[`STRIPE_PRICE_${key}`] || '';
        };

        const CREDIT_PACKS: Record<string, { priceId: string, credits: number }> = {
            'micro': { priceId: getPriceId('MICRO'), credits: 20 },
            'business': { priceId: getPriceId('BUSINESS'), credits: 100 },
            'bulk': { priceId: getPriceId('BULK'), credits: 300 }
        };

        // --- SESSION CREATION WITH AUTO-HEALING FOR INVALID CUSTOMER IDs ---
        const createSession = async (customerId: string) => {
            const commonParams = {
                customer: customerId,
                payment_method_types: ['card'],
                success_url: SUCCESS_URL,
                cancel_url: CANCEL_URL,
            };

            if (type === 'credits') {
                // ... (Credits Logic from above) ...
                // Refetch or use closure values, but for simplicity let's assume params are prepared
                // Actually, better to restructure. Let's keep the logic simple.
                // We will define the session config based on type OUTSIDE, then just pass customerId
                return null; // Placeholder to indicate we need to restructure slightly
            }
            return null;
        };

        // Let's restructure to prepare params first, then try/catch the create call.

        let sessionParams: any = {
            payment_method_types: ['card'],
            success_url: SUCCESS_URL,
            cancel_url: CANCEL_URL,
        };

        if (type === 'credits') {
            let priceId = body.priceId;
            let creditsAmount = 0;

            if (body.pack && CREDIT_PACKS[body.pack]) {
                priceId = CREDIT_PACKS[body.pack].priceId;
                creditsAmount = CREDIT_PACKS[body.pack].credits;
                if (!priceId) throw new Error(`Configuração do Stripe ausente para o pacote: ${body.pack}.`);
            } else {
                priceId = priceId || process.env.STRIPE_CREDITS_PRICE_ID || '';
                if (!priceId) throw new Error("ID de Preço de créditos não configurado.");
            }

            if (priceId.startsWith('prod_')) {
                console.log(`Resolvendo Price ID para Produto de Crédito: ${priceId}`);
                const prices = await stripe.prices.list({ product: priceId, active: true, limit: 1 });
                if (prices.data.length > 0) priceId = prices.data[0].id;
                else throw new Error(`Nenhum preço ativo encontrado para o produto: ${priceId}`);
            }

            sessionParams.mode = 'payment';
            sessionParams.line_items = [{ price: priceId, quantity: 1 }];
            sessionParams.metadata = {
                userId: user.id.toString(),
                type: 'credits',
                creditsAmount: creditsAmount.toString()
            };
        } else {
            // Subscription
            let priceId = body.priceId || query.priceId;
            let planId = body.planId || query.planId;

            // ... (Plan resolution logic - kept same) ...
            if (priceId && !planId) {
                const [plan] = await db.select().from(plans).where(eq(plans.stripe_price_id, priceId)).limit(1);
                if (plan) planId = plan.id;
            }
            if ((!priceId || priceId.includes('placeholder')) && planId) {
                const [plan] = await db.select().from(plans).where(eq(plans.id, parseInt(planId))).limit(1);
                if (plan) {
                    if (plan.stripe_price_id && !plan.stripe_price_id.includes('placeholder')) {
                        priceId = plan.stripe_price_id;
                    } else if (plan.stripe_product_id) {
                        console.log(`Resolvendo Price ID para Produto: ${plan.stripe_product_id}`);
                        const prices = await stripe.prices.list({ product: plan.stripe_product_id, active: true, limit: 1 });
                        if (prices.data.length > 0) {
                            priceId = prices.data[0].id;
                            await db.update(plans).set({ stripe_price_id: priceId }).where(eq(plans.id, plan.id));
                        }
                    }
                }
            }
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
                if (!priceId || priceId.includes('placeholder')) throw new Error("Plano Pro não configurado corretamente.");
                if (!planId && priceId) {
                    const [plan] = await db.select().from(plans).where(eq(plans.stripe_price_id, priceId)).limit(1);
                    if (plan) planId = plan.id;
                }
            }

            sessionParams.mode = 'subscription';
            sessionParams.line_items = [{ price: priceId, quantity: 1 }];
            sessionParams.subscription_data = {
                metadata: { userId: user.id.toString(), planId: planId ? planId.toString() : '' }
            };
            sessionParams.metadata = {
                userId: user.id.toString(),
                type: 'plan',
                planId: planId ? planId.toString() : ''
            };
        }

        // Try to create session, retry if customer not found
        try {
            sessionParams.customer = customerId;
            session = await stripe.checkout.sessions.create(sessionParams);
        } catch (err: any) {
            // Check for specific Stripe error "No such customer"
            if (err.code === 'resource_missing' && err.param === 'customer') {
                console.log(`Customer ${customerId} not found in ${stripeMode} mode. Creating new customer...`);

                // Create new customer
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    metadata: { userId: user.id.toString() }
                });

                // Update DB
                customerId = newCustomer.id;
                await db.update(users).set({ stripe_customer_id: customerId }).where(eq(users.id, userId));

                // Retry session creation
                sessionParams.customer = customerId;
                session = await stripe.checkout.sessions.create(sessionParams);
            } else {
                throw err;
            }
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
