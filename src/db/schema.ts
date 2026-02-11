
import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('amz_users', {
    id: serial('id').primaryKey(),
    email: text('email').unique().notNull(),
    password_hash: text('password_hash').notNull(),
    role: text('role').default('USER').notNull(), // 'USER' | 'ADMIN'
    credits_balance: integer('credits_balance').default(5).notNull(),
    stripe_customer_id: text('stripe_customer_id'),

    // Extended Profile
    full_name: text('full_name'),
    profile_image: text('profile_image'), // Base64 or URL
    phone: text('phone'),
    company_name: text('company_name'),
    address_street: text('address_street'),
    address_city: text('address_city'),
    address_state: text('address_state'),
    address_zip: text('address_zip'),

    created_at: timestamp('created_at').defaultNow(),
    banned_at: timestamp('banned_at'),
    activated_at: timestamp('activated_at'),
    activation_token: text('activation_token'),
    reset_password_token: text('reset_password_token'),
    reset_password_expires: timestamp('reset_password_expires'),
});

export const subscriptions = pgTable('amz_subscriptions', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id).notNull(),
    stripe_subscription_id: text('stripe_subscription_id').unique().notNull(),
    status: text('status').notNull(), // active, past_due, canceled, etc.
    plan_type: text('plan_type').default('FREE').notNull(), // FREE, PRO
    current_period_end: timestamp('current_period_end'),
    created_at: timestamp('created_at').defaultNow(),
});

export const listings = pgTable('amz_listings', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id).notNull(),
    product_name: text('product_name').notNull(),
    listing_data: jsonb('listing_data').notNull(), // Stores the generated JSON
    generated_images: text('generated_images').array(), // URLs or Base64 (prefer URL if storage)
    created_at: timestamp('created_at').defaultNow(),
});

export const generations = pgTable('amz_generations', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id).notNull(),
    type: text('type').notNull(), // 'LISTING', 'IMAGE'
    cost_credits: integer('cost_credits').default(1).notNull(),
    created_at: timestamp('created_at').defaultNow(),
});

export const systemConfig = pgTable('amz_system_config', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    description: text('description'),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const plans = pgTable('amz_plans', {
    id: serial('id').primaryKey(),
    name: text('name').unique().notNull(), // 'Free', 'Starter', 'Pro', 'Premium'
    monthly_price_eur: integer('monthly_price_eur').notNull(), // In cents
    credit_limit: integer('credit_limit').notNull(),
    stripe_price_id: text('stripe_price_id'), // Optional for Free plan
    stripe_product_id: text('stripe_product_id'), // Added to store Product ID (prod_...)
    features_json: jsonb('features_json').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});

export const userSubscriptions = pgTable('amz_user_subscriptions', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id).notNull(),
    plan_id: integer('plan_id').references(() => plans.id).notNull(),
    stripe_subscription_id: text('stripe_subscription_id').unique(),
    status: text('status').notNull(), // active, past_due, canceled, etc.
    current_period_end: timestamp('current_period_end'),
    cancel_at_period_end: boolean('cancel_at_period_end').default(false),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const creditsLedger = pgTable('amz_credits_ledger', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id).notNull(),
    amount: integer('amount').notNull(), // Initial amount of this batch
    remaining_amount: integer('remaining_amount').notNull(), // Current remaining amount
    type: text('type').notNull(), // 'monthly', 'purchased'
    description: text('description'), // e.g. "Monthly Plan Credits", "Micro Pack Purchase"
    expires_at: timestamp('expires_at'), // Null for 'purchased' typically
    created_at: timestamp('created_at').defaultNow(),
});

export const usageHistory = pgTable('amz_usage_history', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users.id).notNull(),
    feature_used: text('feature_used').notNull(), // 'SEARCH_PRODUCT', etc.
    credits_spent: integer('credits_spent').notNull(),
    metadata: jsonb('metadata'), // Optional: store details about the usage (e.g. search term)
    created_at: timestamp('created_at').defaultNow(),
});

export const productsCache = pgTable('amz_products_cache', {
    asin: text('asin').primaryKey(),
    marketplace_id: text('marketplace_id').notNull(),
    title: text('title'),
    image: text('image'),
    category: text('category'),
    brand: text('brand'),
    price: integer('price'), // In cents or lowest currency unit
    currency: text('currency'),
    bsr: integer('bsr'),
    estimated_sales: integer('estimated_sales'),
    estimated_revenue: integer('estimated_revenue'),
    fba_fees: integer('fba_fees'), // Total FBA Fees in cents
    referral_fee: integer('referral_fee'), // In cents
    fulfillment_fee: integer('fulfillment_fee'), // In cents
    net_profit: integer('net_profit'), // Price - FBA Fees (in cents)
    sales_percentile: text('sales_percentile'),
    raw_data: jsonb('raw_data'),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});
