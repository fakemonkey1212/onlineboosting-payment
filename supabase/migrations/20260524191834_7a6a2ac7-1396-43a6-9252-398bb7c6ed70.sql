
-- =========================================================
-- Remove public write policies on sensitive tables
-- =========================================================
DROP POLICY IF EXISTS "Anyone can insert allowed websites" ON public.allowed_websites;
DROP POLICY IF EXISTS "Anyone can update allowed websites" ON public.allowed_websites;
DROP POLICY IF EXISTS "Anyone can delete allowed websites" ON public.allowed_websites;

DROP POLICY IF EXISTS "Anyone can insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can update app_settings" ON public.app_settings;

DROP POLICY IF EXISTS "Anyone can delete blocked logs" ON public.blocked_access_logs;
-- Keep INSERT open for blocked_access_logs so the referrer guard can log attempts.

DROP POLICY IF EXISTS "Anyone can update payment methods" ON public.payment_methods;

-- =========================================================
-- Helper: verify admin password (SECURITY DEFINER, internal)
-- =========================================================
CREATE OR REPLACE FUNCTION public._is_admin_password(_password text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_secrets
    WHERE key = 'admin_password' AND value = _password
  );
$$;
REVOKE ALL ON FUNCTION public._is_admin_password(text) FROM PUBLIC, anon, authenticated;

-- =========================================================
-- Admin-only write RPCs
-- =========================================================

-- Allowed websites
CREATE OR REPLACE FUNCTION public.admin_add_allowed_website(_password text, _url text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _url IS NULL OR length(trim(_url)) = 0 THEN RAISE EXCEPTION 'invalid url'; END IF;
  INSERT INTO public.allowed_websites (url) VALUES (trim(_url)) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_allowed_website(_password text, _id uuid, _url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _url IS NULL OR length(trim(_url)) = 0 THEN RAISE EXCEPTION 'invalid url'; END IF;
  UPDATE public.allowed_websites SET url = trim(_url) WHERE id = _id;
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_allowed_website(_password text, _id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.allowed_websites WHERE id = _id;
  RETURN FOUND;
END $$;

-- App settings (non-sensitive keys only; secrets live in admin_secrets)
CREATE OR REPLACE FUNCTION public.admin_set_app_setting(_password text, _key text, _value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _key IS NULL OR length(trim(_key)) = 0 THEN RAISE EXCEPTION 'invalid key'; END IF;
  -- Disallow tampering with reserved/sensitive keys
  IF _key IN ('admin_email','admin_password','support_gate_number') THEN
    RAISE EXCEPTION 'reserved key';
  END IF;
  INSERT INTO public.app_settings (key, value, updated_at)
    VALUES (_key, COALESCE(_value, ''), now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN true;
END $$;

-- Payment methods
CREATE OR REPLACE FUNCTION public.admin_set_payment_method_enabled(_password text, _id text, _enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.payment_methods SET enabled = _enabled, updated_at = now() WHERE id = _id;
  RETURN FOUND;
END $$;

-- Blocked logs: clear all
CREATE OR REPLACE FUNCTION public.admin_clear_blocked_logs(_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.blocked_access_logs;
  RETURN true;
END $$;

-- Grants: anon/auth can call (they pass password as parameter; function enforces)
GRANT EXECUTE ON FUNCTION public.admin_add_allowed_website(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_allowed_website(text,uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_allowed_website(text,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_app_setting(text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_payment_method_enabled(text,text,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_blocked_logs(text) TO anon, authenticated;
