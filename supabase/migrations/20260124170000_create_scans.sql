-- Create scans table to store user scan history
CREATE TABLE public.scans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    license_name TEXT NOT NULL,
    license_type TEXT NOT NULL,
    verdict TEXT NOT NULL,
    verdict_type TEXT NOT NULL,
    full_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Users can view their own scans
CREATE POLICY "Users can view their own scans"
ON public.scans
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert their own scans"
ON public.scans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete their own scans"
ON public.scans
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX scans_user_id_idx ON public.scans(user_id);
CREATE INDEX scans_created_at_idx ON public.scans(created_at DESC);
