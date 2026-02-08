
import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('amz_users', {
    id: serial('id').primaryKey(),
    email: text('email').unique().notNull(),
    password_hash: text('password_hash').notNull(),
    role: text('role').default('USER').notNull(), // 'USER' | 'ADMIN'
    credits_balance: integer('credits_balance').default(5).notNull(),
    stripe_customer_id: text('stripe_customer_id'),
    created_at: timestamp('created_at').defaultNow(),
    banned_at: timestamp('banned_at'),
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
