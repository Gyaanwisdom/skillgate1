
-- 1. PROFILES: restrict reads
REVOKE SELECT ON public.profiles FROM anon;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_own_read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles_admin_read" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. BOOKINGS: let artisans read their own bookings (and admins)
DROP POLICY IF EXISTS "bookings_artisan_read" ON public.bookings;
CREATE POLICY "bookings_artisan_read" ON public.bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      WHERE a.id = bookings.artisan_id AND a.profile_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "bookings_artisan_update" ON public.bookings;
CREATE POLICY "bookings_artisan_update" ON public.bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.artisans a
      WHERE a.id = bookings.artisan_id AND a.profile_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "bookings_admin_read" ON public.bookings;
CREATE POLICY "bookings_admin_read" ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. USER_ROLES: explicit admin-only write policies (block privilege escalation)
DROP POLICY IF EXISTS "roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "roles_admin_delete" ON public.user_roles;
DROP POLICY IF EXISTS "roles_admin_update" ON public.user_roles;
CREATE POLICY "roles_admin_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. ARTISAN_REGISTRATIONS: only authenticated can apply; only admins can read/manage
DROP POLICY IF EXISTS "reg_public_insert" ON public.artisan_registrations;
DROP POLICY IF EXISTS "reg_auth_insert" ON public.artisan_registrations;
DROP POLICY IF EXISTS "reg_admin_read" ON public.artisan_registrations;
DROP POLICY IF EXISTS "reg_admin_update" ON public.artisan_registrations;
CREATE POLICY "reg_auth_insert" ON public.artisan_registrations FOR INSERT TO authenticated
  WITH CHECK (
    length(full_name) > 0
    AND length(email) > 0
    AND length(category_slug) > 0
  );
CREATE POLICY "reg_admin_read" ON public.artisan_registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reg_admin_update" ON public.artisan_registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. has_role: keep SECURITY DEFINER (required), lock execution further
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
-- Authenticated still needs it for RLS policy evaluation; policies run as the
-- function owner via SECURITY DEFINER, so this GRANT is required for the policy
-- references above to succeed.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;