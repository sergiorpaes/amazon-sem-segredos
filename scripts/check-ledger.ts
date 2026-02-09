
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkLedger() {
    console.log('Checking ledger for user 13 (emporiumamazing@gmail.com)...');
    try {
        const { db } = await import('../src/db');
        const { creditsLedger } = await import('../src/db/schema');
        const { eq } = await import('drizzle-orm');

        const ledger = await db.select().from(creditsLedger).where(eq(creditsLedger.user_id, 13));
        console.log('Ledger entries:', JSON.stringify(ledger, null, 2));

        const { users } = await import('../src/db/schema');
        const [user] = await db.select().from(users).where(eq(users.id, 13)).limit(1);
        console.log('User total balance:', user?.credits_balance);

    } catch (error) {
        console.error('Failed to check ledger:', error);
    } finally {
        process.exit(0);
    }
}

checkLedger();
