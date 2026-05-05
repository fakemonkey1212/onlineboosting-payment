
-- Private table for sensitive admin credentials
CREATE TABLE IF NOT EXISTS public.admin_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

-- Deny all direct client access (no policies = no access for anon/auth roles)
REVOKE ALL ON public.admin_secrets FROM anon, authenticated;

-- Seed defaults from existing app_settings (or hardcoded fallback)
INSERT INTO public.admin_secrets (key, value)
SELECT 'admin_email', COALESCE((SELECT value FROM public.app_settings WHERE key='admin_email'), 'abir789@gmail.com')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_secrets (key, value)
SELECT 'admin_password', COALESCE((SELECT value FROM public.app_settings WHERE key='admin_password'), '778899')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_secrets (key, value)
SELECT 'support_gate_number', COALESCE((SELECT value FROM public.app_settings WHERE key='support_gate_number'), '01789789789')
ON CONFLICT (key) DO NOTHING;

-- Remove the now-sensitive keys from the public app_settings table
DELETE FROM public.app_settings WHERE key IN ('admin_email','admin_password','support_gate_number');

-- Verify admin login
CREATE OR REPLACE FUNCTION public.verify_admin_login(_email text, _password text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_secrets e
    JOIN public.admin_secrets p ON p.key = 'admin_password'
    WHERE e.key = 'admin_email'
      AND e.value = _email
      AND p.value = _password
  );
$$;

-- Verify support gate (the secret unlock number in the support modal)
CREATE OR REPLACE FUNCTION public.verify_support_gate(_number text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_secrets
    WHERE key = 'support_gate_number' AND value = _number
  );
$$;

-- Update admin credentials. Requires the CURRENT password to authorize the change.
-- Any of new_email/new_password/new_support may be NULL or empty to leave unchanged.
CREATE OR REPLACE FUNCTION public.update_admin_secrets(
  _current_password text,
  _new_email text,
  _new_password text,
  _new_support text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_secrets
    WHERE key = 'admin_password' AND value = _current_password
  ) INTO ok;

  IF NOT ok THEN
    RETURN false;
  END IF;

  IF _new_email IS NOT NULL AND length(trim(_new_email)) > 0 THEN
    UPDATE public.admin_secrets
    SET value = trim(_new_email), updated_at = now()
    WHERE key = 'admin_email';
  END IF;

  IF _new_password IS NOT NULL AND length(_new_password) > 0 THEN
    UPDATE public.admin_secrets
    SET value = _new_password, updated_at = now()
    WHERE key = 'admin_password';
  END IF;

  IF _new_support IS NOT NULL AND length(trim(_new_support)) > 0 THEN
    UPDATE public.admin_secrets
    SET value = trim(_new_support), updated_at = now()
    WHERE key = 'support_gate_number';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.update_admin_secrets(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_admin_login(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_support_gate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_secrets(text,text,text,text) TO anon, authenticated;
