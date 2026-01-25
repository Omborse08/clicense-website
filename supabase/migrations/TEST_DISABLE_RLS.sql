-- Temporarily disable RLS to test if that's the issue
ALTER TABLE public.scans DISABLE ROW LEVEL SECURITY;

-- Check if data can be inserted now
-- After testing, re-enable with:
-- ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
