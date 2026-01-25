-- Create subscriptions table to track user subscriptions
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    lemon_squeezy_id TEXT UNIQUE NOT NULL,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();