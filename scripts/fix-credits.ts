
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixCredits() {
    console.log('Fixing credits for emporiumamazing@gmail.com...');
    try {
        const { db } = await import('../src/db');
        const { users, plans, userSubscriptions } = await import('../src/db/schema');
        const { addCredits } = await import('../src/lib/credits');
        const { eq, desc } = await import('drizzle-orm');

        // 1. Find the user
        const [user] = await db.select().from(users).where(eq(users.email, 'emporiumamazing@gmail.com')).limit(1);
        if (!user) {
            console.error('User not found');
            return;
        }

        // 2. Find and cancel old active subscriptions, find the newest one
        const allSubs = await db.select().from(userSubscriptions)
            .where(eq(userSubscriptions.user_id, user.id))
            .orderBy(desc(userSubscriptions.id));

        if (allSubs.length === 0) {
            console.error('No subscription record found');
            return;
        }

        const newestSub = allSubs[0];
        console.log(`Newest subscription: ID ${newestSub.id}, Plan ID ${newestSub.plan_id}`);

        // Cancel others
        for (const sub of allSubs) {
            if (sub.id !== newestSub.id && sub.status === 'active') {
                console.log(`Canceling old subscription ID ${sub.id}`);
                await db.update(userSubscriptions).set({ status: 'canceled' }).where(eq(userSubscriptions.id, sub.id));
            }
        }

        const [plan] = await db.select().from(plans).where(eq(plans.id, newestSub.plan_id)).limit(1);
        if (!plan) {
            console.error('Plan not found for id', newestSub.plan_id);
            return;
        }

        console.log(`Current plan: ${plan.name}, Credit limit: ${plan.credit_limit}`);
        console.log(`Adding ${plan.credit_limit} monthly credits...`);

        await addCredits(user.id, plan.credit_limit, 'monthly', `Plano ${plan.name} (Ativação)`);

        console.log('Credits added successfully.');
    } catch (error) {
        console.error('Failed to fix credits:', error);
    } finally {
        process.exit(0);
    }
}

fixCredits();
