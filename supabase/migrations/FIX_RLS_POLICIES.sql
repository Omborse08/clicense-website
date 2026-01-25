-- First, drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can insert their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;

-- Disable RLS temporarily
ALTER TABLE public.scans DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Create policies with proper permissions
CREATE POLICY "Enable read access for users to their own scans"
ON public.scans
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for authenticated users"
ON public.scans
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users to their own scans"
ON public.scans
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
