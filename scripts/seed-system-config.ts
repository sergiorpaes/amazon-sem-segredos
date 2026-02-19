
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

console.log('DEBUG: NETLIFY_DATABASE_URL defined:', !!process.env.NETLIFY_DATABASE_URL);
if (process.env.NETLIFY_DATABASE_URL) {
    console.log('DEBUG: URL starts with:', process.env.NETLIFY_DATABASE_URL.substring(0, 10) + '...');
}

import { systemConfig } from '../src/db/schema';
import { eq } from 'drizzle-orm';
// Import db dynamically after dotenv

const defaultFeatures = {
    PRODUCT_FINDER: true,
    PROFIT_CALCULATOR: true,
    LISTING_OPTIMIZER: true,
    MENTOR: true,
    ADS_MANAGER: true,
};

const defaultMarketplaces = [
    'ATVPDKIKX0DER', 'A2EUQ1WTGCTBG2', 'A1AM78C64UM0Y8', 'A2Q3Y263D00KWC', // NA
    'A1RKKUPIHCS9HS', 'A1F83G8C2ARO7P', 'A1PA6795UKMFR9', 'A13V1IB3VIYZZH', // EU
    'APJ6JRA9NG5V4', 'A1805IZSGTT6HS', 'A2NODRKZP88ZB9', 'A1C3SOZRARQ6R3',
    'A33AVAJ2PDY3EV', 'A2VIGQ35RCS4UG', 'A17E79C6D8DWNP', 'A21TJRUUN4KGV',
    'A1VC38T7YXB528', 'A39IBJ37TRP1C6', 'A19VAU5U5O7RUS' // FE
];

async function seedSystemConfig() {
    console.log('🌱 Seeding System Configuration...');

    // Dynamic import to ensure env vars are loaded
    const { db } = await import('../src/db');

    try {
        // 1. Global Features
        const existingFeatures = await db.select().from(systemConfig).where(eq(systemConfig.key, 'global_features'));
        if (existingFeatures.length === 0) {
            console.log('Creating global_features...');
            await db.insert(systemConfig).values({
                key: 'global_features',
                value: JSON.stringify(defaultFeatures),
                description: 'Global toggle for application modules',
                updated_at: new Date()
            });
        } else {
            console.log('global_features already exists. Skipping.');
        }

        // 2. Enabled Marketplaces
        const existingMarketplaces = await db.select().from(systemConfig).where(eq(systemConfig.key, 'enabled_marketplaces'));
        if (existingMarketplaces.length === 0) {
            console.log('Creating enabled_marketplaces...');
            await db.insert(systemConfig).values({
                key: 'enabled_marketplaces',
                value: JSON.stringify(defaultMarketplaces),
                description: 'List of enabled Amazon marketplace IDs',
                updated_at: new Date()
            });
        } else {
            console.log('enabled_marketplaces already exists. Skipping.');
        }

        console.log('✅ System Configuration seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error Seeding System Config:', error);
        process.exit(1);
    }
}

seedSystemConfig();
