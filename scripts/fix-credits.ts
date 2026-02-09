
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixCredits() {
    console.log('Fixing credits for emporiumamazing@gmail.com...');
    try {
        const { db } = await import('../src/db');
        const { users, plans, userSubscriptions } = await import('../src/db/schema');
        const { addCredits } = await import('../src/lib/credits');
        const { eq } = await import('drizzle-orm');

        // 1. Find the user
        const [user] = await db.select().from(users).where(eq(users.email, 'emporiumamazing@gmail.com')).limit(1);
        if (!user) {
            console.error('User not found');
            return;
        }

        // 2. Find their subscription and plan
        const [sub] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.user_id, user.id)).limit(1);
        if (!sub) {
            console.error('No subscription record found');
            return;
        }

        const [plan] = await db.select().from(plans).where(eq(plans.id, sub.plan_id)).limit(1);
        if (!plan) {
            console.error('Plan not found for id', sub.plan_id);
            return;
        }

        console.log(`Current plan: ${plan.name}, Credit limit: ${plan.credit_limit}`);
        console.log(`Adding ${plan.credit_limit} monthly credits...`);

        await addCredits(user.id, plan.credit_limit, 'monthly', `Renovação Plano ${plan.name} (Correção Manual)`);

        console.log('Credits added successfully.');
    } catch (error) {
        console.error('Failed to fix credits:', error);
    } finally {
        process.exit(0);
    }
}

fixCredits();
