import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { db } = await import('../src/db');
const { plans } = await import('../src/db/schema');
import { eq } from 'drizzle-orm';

const PLANS_DATA = [
    {
        name: 'Free',
        monthly_price_eur: 0,
        credit_limit: 5,
        stripe_price_id: null,
        stripe_product_id: null,
        features_json: JSON.stringify(['5 créditos iniciais', 'Acesso básico']),
    },
    {
        name: 'Starter',
        monthly_price_eur: 1900, // €19.00
        credit_limit: 50,
        stripe_price_id: 'price_starter_placeholder', // Needs to be resolved from Product ID or updated manually
        stripe_product_id: 'prod_TwlXs6KmXub6lX',
        features_json: JSON.stringify(['50 créditos/mês', 'Acesso a Mentor', 'Suporte por e-mail']),
    },
    {
        name: 'Pro',
        monthly_price_eur: 4900, // €49.00
        credit_limit: 200,
        stripe_price_id: 'price_pro_placeholder',
        stripe_product_id: 'prod_TwlXYBixvGkK9Z',
        features_json: JSON.stringify(['200 créditos/mês', 'Acesso a tudo do Starter', 'Análise de ROI']),
    },
    {
        name: 'Premium',
        monthly_price_eur: 9900, // €99.00
        credit_limit: 600,
        stripe_price_id: 'price_premium_placeholder',
        stripe_product_id: 'prod_TwlYZDMvLpxeXb',
        features_json: JSON.stringify(['600 créditos/mês', 'Tudo ilimitado', 'Mentoria VIP']),
    }
];

async function seed() {
    console.log('🌱 Seeding Plans...');

    for (const plan of PLANS_DATA) {
        const existing = await db.select().from(plans).where(eq(plans.name, plan.name)).limit(1);

        if (existing.length === 0) {
            await db.insert(plans).values(plan);
            console.log(`✅ Created plan: ${plan.name}`);
        } else {
            await db.update(plans).set(plan).where(eq(plans.name, plan.name));
            console.log(`🔄 Updated plan: ${plan.name}`);
        }
    }

    console.log('✨ Seeding complete!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
