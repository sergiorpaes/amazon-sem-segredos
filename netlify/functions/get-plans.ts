
import { db } from '../../src/db';
import { plans } from '../../src/db/schema';
import { asc } from 'drizzle-orm';

export const handler = async (event: any) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const allPlans = await db.select().from(plans).orderBy(asc(plans.monthly_price_eur));

        return {
            statusCode: 200,
            body: JSON.stringify(allPlans)
        };
    } catch (error: any) {
        console.error('Error fetching plans:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch plans' })
        };
    }
};
