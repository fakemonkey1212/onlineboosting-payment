CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Hash the existing admin password (bcrypt) if it is still plain text
UPDATE public.admin_secrets
   SET value = extensions.crypt(value, extensions.gen_salt('bf', 12)), updated_at = now()
 WHERE key = 'admin_password' AND value NOT LIKE '$2%';

CREATE OR REPLACE FUNCTION public._is_admin_password(_password text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(_password, '') <> '' AND EXISTS (
    SELECT 1 FROM public.admin_secrets
    WHERE key = 'admin_password' AND value = extensions.crypt(_password, value)
  );
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_login(_email text, _password text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_secrets e
    WHERE e.key = 'admin_email' AND lower(e.value) = lower(trim(COALESCE(_email, '')))
  ) AND public._is_admin_password(_password);
$$;

CREATE OR REPLACE FUNCTION public.update_admin_secrets(_current_password text, _new_email text, _new_password text, _new_support text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public._is_admin_password(_current_password) THEN RETURN false; END IF;
  IF _new_email IS NOT NULL AND length(trim(_new_email)) > 0 THEN
    UPDATE public.admin_secrets SET value = trim(_new_email), updated_at = now() WHERE key = 'admin_email';
  END IF;
  IF _new_password IS NOT NULL AND length(_new_password) > 0 THEN
    UPDATE public.admin_secrets
       SET value = extensions.crypt(_new_password, extensions.gen_salt('bf', 12)), updated_at = now()
     WHERE key = 'admin_password';
  END IF;
  IF _new_support IS NOT NULL AND length(trim(_new_support)) > 0 THEN
    UPDATE public.admin_secrets SET value = trim(_new_support), updated_at = now() WHERE key = 'support_gate_number';
  END IF;
  RETURN true;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  csrf_hash text NOT NULL,
  ip text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
GRANT ALL ON public.admin_sessions TO service_role;
REVOKE ALL ON public.admin_sessions FROM anon, authenticated;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_idx ON public.admin_login_attempts (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_login_attempts_email_idx ON public.admin_login_attempts (email, created_at DESC);
GRANT ALL ON public.admin_login_attempts TO service_role;
REVOKE ALL ON public.admin_login_attempts FROM anon, authenticated;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Least privilege: admin functions are server-only
REVOKE EXECUTE ON FUNCTION public._is_admin_password(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_admin_login(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admin_secrets(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_add_allowed_website(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_clear_blocked_logs(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_allowed_website(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_allowed_websites(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_app_settings(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_blocked_logs(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_payment_methods(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_app_setting(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_payment_method_enabled(text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_telegram_status(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_allowed_website(text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_telegram(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._is_admin_password(text), public.verify_admin_login(text, text),
  public.update_admin_secrets(text, text, text, text) TO service_role;