-- Add cancel_at_period_end column to amz_user_subscriptions table
ALTER TABLE amz_user_subscriptions 
ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
