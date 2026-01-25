-- 1. Get the User ID from Authentication > Users
-- Replace 'USER_ID_HERE' with the actual User ID (e.g., 'a0eebc99-9c0b-...')
-- Replace 'PLAN_NAME' with 'Pro' or 'Team'
-- Replace 'CREDITS_AMOUNT' with 500 (Pro) or 2000 (Team)

BEGIN;

-- A. Update User Credits & Plan in Metadata
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'credits', 500,        -- Set credits (500 for Pro)
    'plan', 'pro'          -- Set plan name (lowercase)
  )
WHERE id = 'USER_ID_HERE';

-- B. Add/Update Subscription Record
INSERT INTO public.subscriptions (
    user_id,
    plan_name,
    status,
    lemon_squeezy_id,
    order_id,
    product_id,
    variant_id,
    renews_at,
    created_at,
    updated_at
) 
VALUES (
    'USER_ID_HERE',       -- Same User ID
    'Pro',                -- Plan Name (Capitalized)
    'active',             -- Status
    'manual_entry',       -- Dummy ID
    'manual_order',       -- Dummy Order
    'manual_product',     -- Dummy Product
    'manual_variant',     -- Dummy Variant
    NOW() + INTERVAL '1 month', -- Renews in 30 days
    NOW(),
    NOW()
)
ON CONFLICT (user_id) -- Assuming one subscription per user, modify if schema differs
DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    status = 'active',
    renews_at = EXCLUDED.renews_at,
    updated_at = NOW();

COMMIT;
