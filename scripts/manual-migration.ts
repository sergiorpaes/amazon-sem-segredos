
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NETLIFY_DATABASE_URL!);

async function migrate() {
    console.log('🔄 Running manual migration for missing tables...');
    try {
        // 1. amz_user_subscriptions
        console.log('Checking amz_user_subscriptions...');
        await sql`
            CREATE TABLE IF NOT EXISTS "amz_user_subscriptions" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" integer NOT NULL REFERENCES "amz_users"("id"),
                "plan_id" integer NOT NULL REFERENCES "amz_plans"("id"),
                "stripe_subscription_id" text UNIQUE,
                "status" text NOT NULL,
                "current_period_end" timestamp,
                "created_at" timestamp DEFAULT now(),
                "updated_at" timestamp DEFAULT now()
            );
        `;
        console.log('✅ amz_user_subscriptions verified/created.');

        // 2. amz_credits_ledger
        console.log('Checking amz_credits_ledger...');
        await sql`
            CREATE TABLE IF NOT EXISTS "amz_credits_ledger" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" integer NOT NULL REFERENCES "amz_users"("id"),
                "amount" integer NOT NULL,
                "remaining_amount" integer NOT NULL,
                "type" text NOT NULL,
                "description" text,
                "expires_at" timestamp,
                "created_at" timestamp DEFAULT now()
            );
        `;
        console.log('✅ amz_credits_ledger verified/created.');

        // 3. amz_usage_history
        console.log('Checking amz_usage_history...');
        await sql`
            CREATE TABLE IF NOT EXISTS "amz_usage_history" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" integer NOT NULL REFERENCES "amz_users"("id"),
                "feature_used" text NOT NULL,
                "credits_spent" integer NOT NULL,
                "metadata" jsonb,
                "created_at" timestamp DEFAULT now()
            );
        `;
        console.log('✅ amz_usage_history verified/created.');

        // 4. amz_generations
        console.log('Checking amz_generations...');
        await sql`
            CREATE TABLE IF NOT EXISTS "amz_generations" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" integer NOT NULL REFERENCES "amz_users"("id"),
                "type" text NOT NULL,
                "cost_credits" integer DEFAULT 1 NOT NULL,
                "created_at" timestamp DEFAULT now()
            );
        `;
        console.log('✅ amz_generations verified/created.');

        console.log('✅ Full schema migration successful');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
