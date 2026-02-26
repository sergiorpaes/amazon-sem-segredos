
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

        // Preparation for parameters
        let priceId: string | undefined;
        let planId: any;
        let sessionParams: any = {
            payment_method_types: ['card'],
            success_url: SUCCESS_URL,
            cancel_url: CANCEL_URL,
        };

        if (type === 'credits') {
            priceId = body.priceId;
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
            priceId = body.priceId || query.priceId;
            planId = body.planId || query.planId;

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

        // --- RESILIENCE HELPERS ---

        const resolvePriceFromProduct = async (productId: string, planDbId?: number) => {
            try {
                console.log(`Auto-healing: Resolving Price ID for Product ${productId} in ${stripeMode} mode...`);
                const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
                if (prices.data.length > 0) {
                    const newPriceId = prices.data[0].id;
                    if (planDbId) {
                        await db.update(plans).set({ stripe_price_id: newPriceId }).where(eq(plans.id, planDbId));
                    }
                    return newPriceId;
                }
            } catch (e) {
                console.warn(`Could not resolve price from product ID ${productId}. Product might be missing in ${stripeMode} mode.`);
            }
            return null;
        };

        const resolvePriceByPlanName = async (planName: string, planDbId: number) => {
            try {
                console.log(`Ultimate Fallback: Searching for product named "${planName}" in Stripe...`);
                const products = await stripe.products.search({ query: `name:'${planName}' AND active:'true'` });
                const product = products.data[0];

                if (product) {
                    console.log(`Found product ${product.id} for plan ${planName}. Resolving Price...`);
                    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
                    if (prices.data.length > 0) {
                        const newPriceId = prices.data[0].id;
                        await db.update(plans).set({
                            stripe_product_id: product.id,
                            stripe_price_id: newPriceId
                        }).where(eq(plans.id, planDbId));
                        return newPriceId;
                    }
                }
            } catch (e: any) {
                console.error(`Failed to resolve plan by name "${planName}":`, e.message);
            }
            return null;
        };

        const tryCreateSession = async (pId: string, cId: string) => {
            sessionParams.customer = cId;
            sessionParams.line_items = [{ price: pId, quantity: 1 }];
            return await stripe.checkout.sessions.create(sessionParams);
        };

        // --- EXECUTION WITH RETRY ---

        try {
            session = await tryCreateSession(priceId!, customerId!);
        } catch (err: any) {
            // Check for missing resource (price or product)
            const isMissingResource =
                err.message?.toLowerCase().includes('no such price') ||
                err.message?.toLowerCase().includes('no such product') ||
                (err.code === 'resource_missing' && (err.param === 'line_items[0][price]' || err.param === 'product'));

            if (isMissingResource) {
                console.warn(`Stripe resource error: ${err.message}. Attempting to auto-resolve...`);

                let plan;
                if (priceId) {
                    const results = await db.select().from(plans).where(eq(plans.stripe_price_id, priceId)).limit(1);
                    plan = results[0];
                }

                // Fallback 1: Resolve by Product ID
                if (plan?.stripe_product_id) {
                    const resolvedPriceId = await resolvePriceFromProduct(plan.stripe_product_id, plan.id);
                    if (resolvedPriceId) {
                        console.log(`Auto-healing success (ID): Retrying with Price ID ${resolvedPriceId}`);
                        session = await tryCreateSession(resolvedPriceId, customerId!);
                        return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
                    }
                }

                // Fallback 2: Ultimate fallback - Search by Name
                const fallbackPlanId = plan?.id || (planId ? parseInt(planId.toString()) : null);
                let planToFix = plan;
                if (!planToFix && fallbackPlanId) {
                    const results = await db.select().from(plans).where(eq(plans.id, fallbackPlanId)).limit(1);
                    planToFix = results[0];
                }
                if (!planToFix) {
                    const results = await db.select().from(plans).where(eq(plans.name, 'Pro')).limit(1);
                    planToFix = results[0];
                }
                if (planToFix) {
                    const resolvedPriceId = await resolvePriceByPlanName(planToFix.name, planToFix.id);
                    if (resolvedPriceId) {
                        console.log(`Auto-healing success (NAME): Retrying with Price ID ${resolvedPriceId}`);
                        session = await tryCreateSession(resolvedPriceId, customerId!);
                        return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
                    }
                }

                throw new Error(`Configuração do Stripe incompleta para o modo ${stripeMode}. Verifique se o produto "${planToFix?.name || 'Pro'}" está criado no Stripe Dashboard.`);
            }

            // Customer not found
            if (err.code === 'resource_missing' && err.param === 'customer') {
                console.log(`Customer ${customerId} not found in ${stripeMode} mode. Creating new customer...`);
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    metadata: { userId: user.id.toString() }
                });
                customerId = newCustomer.id;
                await db.update(users).set({ stripe_customer_id: customerId }).where(eq(users.id, userId));
                sessionParams.customer = customerId;
                session = await tryCreateSession(priceId!, customerId);
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
