
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


async function updateFreeUsers() {
    console.log('🔄 Checking existing Free users...');

    const { db } = await import('../src/db');
    const { users, userSubscriptions, plans } = await import('../src/db/schema');
    const { eq, and } = await import('drizzle-orm');

    // 1. Get Free Plan ID
    const [freePlan] = await db.select().from(plans).where(eq(plans.name, 'Free')).limit(1);

    if (!freePlan) {
        console.error('❌ Free plan not found!');
        process.exit(1);
    }

    console.log(`Free Plan ID: ${freePlan.id}`);

    // 2. Find all users with active Free subscription (or valid subscription to Free)
    // Actually, we should look for users who are effectively on the Free plan.
    // This includes users with 'active' subscription to plan_id = freePlan.id

    const freeSubs = await db.select()
        .from(userSubscriptions)
        .where(and(
            eq(userSubscriptions.plan_id, freePlan.id),
            eq(userSubscriptions.status, 'active')
        ));

    console.log(`Found ${freeSubs.length} users on Free plan.`);

    let updatedCount = 0;

    for (const sub of freeSubs) {
        const [user] = await db.select().from(users).where(eq(users.id, sub.user_id)).limit(1);

        if (user && user.credits_balance < 30) {
            console.log(`Updating User ${user.email} (Balance: ${user.credits_balance} -> 30)`);

            await db.update(users)
                .set({ credits_balance: 30 })
                .where(eq(users.id, user.id));

            updatedCount++;
        }
    }

    console.log(`✅ Updated ${updatedCount} users to 30 credits.`);
    process.exit(0);
}

updateFreeUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
