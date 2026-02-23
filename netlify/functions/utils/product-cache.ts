import { db } from '../../../src/db';
import { productsCache } from '../../../src/db/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Retrieves a cached product if it exists and is less than 24 hours old.
 */
export async function getCachedProduct(asin: string) {
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        const results = await db
            .select()
            .from(productsCache)
            .where(
                and(
                    eq(productsCache.asin, asin),
                    gt(productsCache.updated_at, oneDayAgo)
                )
            )
            .limit(1);

        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error(`[Cache] Error retrieving ASIN ${asin}:`, error);
        return null;
    }
}

/**
 * Upserts product data into the cache.
 */
export async function cacheProduct(data: {
    asin: string;
    marketplace_id: string;
    title?: string;
    image?: string;
    category?: string;
    brand?: string;
    price?: number;
    currency?: string;
    bsr?: number;
    estimated_sales?: number;
    estimated_revenue?: number;
    fba_fees?: number;
    referral_fee?: number;
    fulfillment_fee?: number;
    net_profit?: number;
    sales_percentile?: string;
    is_list_price?: boolean;
    raw_data?: any;
}) {
    try {
        await db
            .insert(productsCache)
            .values({
                ...data,
                updated_at: new Date(),
            })
            .onConflictDoUpdate({
                target: productsCache.asin,
                set: {
                    ...data,
                    updated_at: new Date(),
                },
            });
        console.log(`[Cache] Successfully cached ASIN ${data.asin}`);
    } catch (error) {
        console.error(`[Cache] Error saving ASIN ${data.asin}:`, error);
    }
}
