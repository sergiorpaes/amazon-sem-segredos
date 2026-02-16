import { Handler } from '@netlify/functions';
import { db } from '../../src/db';
import { users, userSubscriptions, plans, usageHistory, systemConfig } from '../../src/db/schema';
import { eq, sql, and, gte, desc, count, countDistinct, sum } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

export const handler: Handler = async (event) => {
    console.log('[get-admin-stats] Starting request');
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Auth check
        let token = event.headers.authorization?.replace('Bearer ', '');
        if (!token || token === 'null' || token === 'undefined') {
            const cookies = cookie.parse(event.headers.cookie || '');
            token = cookies.auth_token;
        }
        if (!token) {
            console.log('[get-admin-stats] No token found');
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'ADMIN') {
            console.log('[get-admin-stats] User is not ADMIN');
            return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
        }

        // 2. Fetch Stats using Drizzle
        console.log('[get-admin-stats] Fetching general stats...');

        // Total Users
        const [totalUsersRes] = await db.select({ count: count() }).from(users);
        const totalUsers = Number(totalUsersRes?.count || 0);

        // Active Subscriptions (Distinct Users)
        const [activeSubsRes] = await db
            .select({ count: countDistinct(userSubscriptions.user_id) })
            .from(userSubscriptions)
            .where(eq(userSubscriptions.status, 'active'));
        const activeSubs = Number(activeSubsRes?.count || 0);

        // Monthly Revenue (sum of distinct active sub prices)
        console.log('[get-admin-stats] Calculating revenue...');
        const revenueSubquery = db
            .select({
                revenue: plans.monthly_price_eur,
                rn: sql<number>`ROW_NUMBER() OVER(PARTITION BY ${userSubscriptions.user_id} ORDER BY ${userSubscriptions.updated_at} DESC)`.as('rn')
            })
            .from(userSubscriptions)
            .innerJoin(plans, eq(userSubscriptions.plan_id, plans.id))
            .where(eq(userSubscriptions.status, 'active'))
            .as('rev_sq');

        const [revenueRes] = await db
            .select({ total: sum(revenueSubquery.revenue) })
            .from(revenueSubquery)
            .where(eq(revenueSubquery.rn, 1));
        const monthlyRevenue = (Number(revenueRes?.total || 0)) / 100;

        // Total Credit Usage
        const [creditUsageRes] = await db
            .select({ total: sum(usageHistory.credits_spent) })
            .from(usageHistory);
        const totalCreditUsage = Number(creditUsageRes?.total || 0);

        // Churn calculation (cancellations in last 30 days)
        console.log('[get-admin-stats] Calculating churn...');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [cancellationsRes] = await db
            .select({ count: countDistinct(userSubscriptions.user_id) })
            .from(userSubscriptions)
            .where(and(
                eq(userSubscriptions.status, 'canceled'),
                gte(userSubscriptions.updated_at, thirtyDaysAgo)
            ));
        const cancellationsLast30d = Number(cancellationsRes?.count || 0);
        const churnRate = activeSubs > 0 ? (cancellationsLast30d / (activeSubs + cancellationsLast30d)) * 100 : 0;

        // Growth Data
        console.log('[get-admin-stats] Fetching growth data...');
        const signupDateExpr = sql`TO_CHAR(${users.created_at}, 'YYYY-MM-DD')`;
        const signupsPerDay = await db
            .select({
                date: signupDateExpr,
                count: count()
            })
            .from(users)
            .where(gte(users.created_at, thirtyDaysAgo))
            .groupBy(signupDateExpr)
            .orderBy(signupDateExpr);

        const cancelDateExpr = sql`TO_CHAR(${userSubscriptions.updated_at}, 'YYYY-MM-DD')`;
        const cancellationsPerDay = await db
            .select({
                date: cancelDateExpr,
                count: countDistinct(userSubscriptions.user_id)
            })
            .from(userSubscriptions)
            .where(and(
                eq(userSubscriptions.status, 'canceled'),
                gte(userSubscriptions.updated_at, thirtyDaysAgo)
            ))
            .groupBy(cancelDateExpr)
            .orderBy(cancelDateExpr);

        // Format growth data
        const growthDataMap: Record<string, { date: string, signups: number, cancellations: number }> = {};
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            growthDataMap[dateStr] = { date: dateStr, signups: 0, cancellations: 0 };
        }

        signupsPerDay.forEach(row => {
            const dateStr = row.date as string;
            if (dateStr && growthDataMap[dateStr]) growthDataMap[dateStr].signups = Number(row.count);
        });
        cancellationsPerDay.forEach(row => {
            const dateStr = row.date as string;
            if (dateStr && growthDataMap[dateStr]) growthDataMap[dateStr].cancellations = Number(row.count);
        });

        const growthData = Object.values(growthDataMap);

        // Maintenance Status
        console.log('[get-admin-stats] Checking maintenance status...');
        let isMaintenanceMode = false;
        try {
            const config = await db.select().from(systemConfig).where(eq(systemConfig.key, 'maintenance_mode')).limit(1);
            isMaintenanceMode = config.length > 0 ? config[0].value === 'true' : false;
        } catch (e) {
            console.warn('systemConfig table might not exist yet');
        }

        console.log('[get-admin-stats] Success!');
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                totalUsers,
                activeSubs,
                monthlyRevenue,
                churnRate: Math.round(churnRate * 10) / 10,
                totalCreditUsage,
                growthData,
                isMaintenanceMode
            })
        };

    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

