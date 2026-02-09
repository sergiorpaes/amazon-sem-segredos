import { db } from '../db';
import { users, creditsLedger, usageHistory } from '../db/schema';
import { eq, and, gt, asc } from 'drizzle-orm';

export async function consumeCredits(
    userId: number,
    cost: number,
    feature: string,
    metadata?: any
) {
    // Return early if cost is 0
    if (cost <= 0) return { success: true, remainingBalance: 0 };

    return await db.transaction(async (tx) => {
        // ... (rest of logic)

        // 1. Get user to check total balance first (optimization)
        const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) throw new Error('User not found');

        if (user.credits_balance < cost) {
            throw new Error('Insufficient credits');
        }

        // 2. Fetch active ledger entries with remaining amount > 0
        // Order by: 
        // - type: 'monthly' first (we can sort by specific custom order or just rely on expiry)
        // - expires_at ASC (consume expiring first)
        // - created_at ASC (FIFO)
        const entries = await tx
            .select()
            .from(creditsLedger)
            .where(and(
                eq(creditsLedger.user_id, userId),
                gt(creditsLedger.remaining_amount, 0)
            ))
            .orderBy(
                asc(creditsLedger.expires_at), // Nulls last by default in Postgres? Need to check.
                // Actually, 'monthly' usually has expiry, 'purchased' might not. 
                // We want to consume 'monthly' first.
                // If 'purchased' has no expiry (null), it sorts last in ASC usually (depending on DB config, but often NULLS LAST).
                // Let's rely on type logic if needed, but expiry is the main driver.
                asc(creditsLedger.created_at)
            );

        let remainingCost = cost;
        const updates = [];

        // Manual sort to ensure 'monthly' comes before 'purchased' if expiry is same or null logic fails
        entries.sort((a, b) => {
            if (a.type === 'monthly' && b.type !== 'monthly') return -1;
            if (a.type !== 'monthly' && b.type === 'monthly') return 1;
            // If same type, use expiry
            if (a.expires_at && !b.expires_at) return -1;
            if (!a.expires_at && b.expires_at) return 1;
            if (a.expires_at && b.expires_at) {
                return a.expires_at.getTime() - b.expires_at.getTime();
            }
            return a.created_at!.getTime() - b.created_at!.getTime();
        });

        for (const entry of entries) {
            if (remainingCost <= 0) break;

            const deduct = Math.min(entry.remaining_amount, remainingCost);

            updates.push({
                id: entry.id,
                newRemaining: entry.remaining_amount - deduct
            });

            remainingCost -= deduct;
        }

        if (remainingCost > 0) {
            // Should not happen if total balance check passed, but sync issues might exist
            throw new Error('Insufficient active credits in ledger');
        }

        // 3. Apply updates to ledger
        for (const update of updates) {
            await tx.update(creditsLedger)
                .set({ remaining_amount: update.newRemaining })
                .where(eq(creditsLedger.id, update.id));
        }

        // 4. Record usage history
        await tx.insert(usageHistory).values({
            user_id: userId,
            feature_used: feature,
            credits_spent: cost,
            metadata: metadata,
            created_at: new Date()
        });

        // 5. Update user total balance
        const [updatedUser] = await tx.update(users)
            .set({ credits_balance: user.credits_balance - cost })
            .where(eq(users.id, userId))
            .returning();

        return {
            success: true,
            remainingBalance: updatedUser.credits_balance
        };
    });
}

/**
 * Adds credits to a user's ledger (e.g. from purchase or monthly reset).
 */
export async function addCredits(
    userId: number,
    amount: number,
    type: 'monthly' | 'purchased',
    description: string
) {
    return await db.transaction(async (tx) => {
        // Determine expiry
        let expiresAt: Date | null = null;
        if (type === 'monthly') {
            // Expires in 1 month
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            expiresAt = d;
        }

        // Insert into ledger
        await tx.insert(creditsLedger).values({
            user_id: userId,
            amount: amount,
            remaining_amount: amount,
            type: type,
            description: description,
            expires_at: expiresAt,
            created_at: new Date()
        });

        // Update user total balance
        const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);

        const [updatedUser] = await tx.update(users)
            .set({ credits_balance: (user?.credits_balance || 0) + amount })
            .where(eq(users.id, userId))
            .returning();

        return updatedUser;
    });
}
