
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from "../src/db";
import { plans } from "../src/db/schema";
import { eq } from "drizzle-orm";

const LIVE_PLANS = [
    {
        name: 'Starter',
        stripe_price_id: 'price_1T2Vdo1rcNqUR0ACmJ8AkfLX',
        stripe_product_id: 'prod_U0WhL3oVnCa7GB'
    },
    {
        name: 'Pro',
        stripe_price_id: 'price_1T2Vdm1rcNqUR0AC0YuIzAfc',
        stripe_product_id: 'prod_U0WhCyWUaqLt5A'
    },
    {
        name: 'Premium',
        stripe_price_id: 'price_1T2Vdj1rcNqUR0AC5fwbKyYz',
        stripe_product_id: 'prod_U0Whv5P9UdL2mj'
    }
];

async function updatePlans() {
    console.log('🔄 Updating Plans to Stripe Live Mode IDs...');

    for (const plan of LIVE_PLANS) {
        console.log(`Updating ${plan.name}...`);
        console.log(`  Price ID: ${plan.stripe_price_id}`);
        console.log(`  Product ID: ${plan.stripe_product_id}`);

        await db.update(plans)
            .set({
                stripe_price_id: plan.stripe_price_id,
                stripe_product_id: plan.stripe_product_id
            })
            .where(eq(plans.name, plan.name));
    }

    console.log('✅ Update complete!');
    process.exit(0);
}

updatePlans().catch(err => {
    console.error('❌ Update failed:', err);
    process.exit(1);
});
