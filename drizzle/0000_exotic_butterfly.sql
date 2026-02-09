CREATE TABLE "amz_credits_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"remaining_amount" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "amz_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"cost_credits" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "amz_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"listing_data" jsonb NOT NULL,
	"generated_images" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "amz_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"monthly_price_eur" integer NOT NULL,
	"credit_limit" integer NOT NULL,
	"features_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "amz_plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "amz_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"status" text NOT NULL,
	"plan_type" text DEFAULT 'FREE' NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "amz_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "amz_system_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "amz_usage_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"feature_used" text NOT NULL,
	"credits_spent" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "amz_user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"stripe_subscription_id" text,
	"status" text NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "amz_user_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "amz_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	"credits_balance" integer DEFAULT 5 NOT NULL,
	"stripe_customer_id" text,
	"phone" text,
	"company_name" text,
	"address_street" text,
	"address_city" text,
	"address_state" text,
	"address_zip" text,
	"created_at" timestamp DEFAULT now(),
	"banned_at" timestamp,
	"activated_at" timestamp,
	"activation_token" text,
	"reset_password_token" text,
	"reset_password_expires" timestamp,
	CONSTRAINT "amz_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "amz_credits_ledger" ADD CONSTRAINT "amz_credits_ledger_user_id_amz_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amz_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amz_generations" ADD CONSTRAINT "amz_generations_user_id_amz_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amz_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amz_listings" ADD CONSTRAINT "amz_listings_user_id_amz_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amz_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amz_subscriptions" ADD CONSTRAINT "amz_subscriptions_user_id_amz_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amz_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amz_usage_history" ADD CONSTRAINT "amz_usage_history_user_id_amz_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amz_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amz_user_subscriptions" ADD CONSTRAINT "amz_user_subscriptions_user_id_amz_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."amz_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amz_user_subscriptions" ADD CONSTRAINT "amz_user_subscriptions_plan_id_amz_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."amz_plans"("id") ON DELETE no action ON UPDATE no action;