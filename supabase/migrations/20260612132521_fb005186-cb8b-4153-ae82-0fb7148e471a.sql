
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role still callable by authenticated (needed for policies); explicitly grant
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
-- Tighten reg insert: anyone can apply but rate-limited by basic non-empty check
DROP POLICY IF EXISTS "reg_public_insert" ON public.artisan_registrations;
CREATE POLICY "reg_public_insert" ON public.artisan_registrations FOR INSERT
  WITH CHECK (length(full_name) > 0 AND length(email) > 0 AND length(category_slug) > 0);
