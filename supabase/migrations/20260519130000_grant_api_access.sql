-- Allow Supabase Data API (anon/authenticated) to access workout tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.routines TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exercises TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sets TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
