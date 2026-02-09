
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSub() {
    console.log('Checking subscription for emporiumamazing@gmail.com...');
    try {
        const { db } = await import('../src/db');
        const { users, userSubscriptions } = await import('../src/db/schema');
        const { eq } = await import('drizzle-orm');

        const [user] = await db.select().from(users).where(eq(users.email, 'emporiumamazing@gmail.com')).limit(1);
        if (user) {
            const subs = await db.select().from(userSubscriptions).where(eq(userSubscriptions.user_id, user.id));
            console.log('Subscriptions:', JSON.stringify(subs, null, 2));
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('Failed to check subscription:', error);
    } finally {
        process.exit(0);
    }
}

checkSub();
