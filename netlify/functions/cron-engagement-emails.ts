import { schedule } from '@netlify/functions';
import { db } from '../../src/db';
import { users, userSubscriptions } from '../../src/db/schema';
import { sendEngagementDay1, sendEngagementDay2, sendEngagementDay3, sendEngagementDay5 } from './utils/email';
import { and, eq } from 'drizzle-orm';

// This function runs once per day
export const handler = schedule("@daily", async (event) => {
    console.log("[CRON] Starting daily engagement email sequence check...");

    try {
        const now = new Date();
        const allUsers = await db.select().from(users);

        let sentDay1 = 0;
        let sentDay2 = 0;
        let sentDay3 = 0;
        let sentDay5 = 0;

        for (const user of allUsers) {
            // We only send these to users who are likely still on a trial or need engagement
            // If you only want to send to 'USER' role and not 'PRO'/'ADMIN', add a check:
            // if (user.role !== 'USER') continue;

            const createdAt = new Date(user.created_at || now);
            const diffTime = Math.abs(now.getTime() - createdAt.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Diff in days

            try {
                // Day 1: 1 day after account creation
                if (diffDays === 1) {
                    await sendEngagementDay1(user.email, 'Vendedor(a)');
                    sentDay1++;
                }
                // Day 2: 2 days after account creation
                else if (diffDays === 2) {
                    await sendEngagementDay2(user.email, 'Vendedor(a)');
                    sentDay2++;
                }
                // Day 3: 3 days after account creation
                else if (diffDays === 3) {
                    await sendEngagementDay3(user.email, 'Vendedor(a)');
                    sentDay3++;
                }
                // Day 5: 5 days after account creation (Offer Starter if no active plan)
                else if (diffDays === 5) {
                    const activeSubs = await db.select().from(userSubscriptions).where(
                        and(
                            eq(userSubscriptions.user_id, user.id),
                            eq(userSubscriptions.status, 'active')
                        )
                    ).limit(1);

                    if (activeSubs.length === 0) {
                        await sendEngagementDay5(user.email, 'Vendedor(a)');
                        sentDay5++;
                    }
                }
            } catch (emailError) {
                console.error(`[CRON] Failed to send engagement email to ${user.email} (Day ${diffDays}):`, emailError);
            }
        }

        console.log(`[CRON] Engagement check completed. Sent: Day 1 (${sentDay1}), Day 2 (${sentDay2}), Day 3 (${sentDay3}), Day 5 (${sentDay5})`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Daily engagement logic executed." })
        };
    } catch (error) {
        console.error("[CRON] Error checking daily engagement:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to run engagement sequence." })
        };
    }
});
