-- Default admin credentials, stored only as hashes (bcrypt for password, sha256 for email/support number).
INSERT INTO public.admin_secrets (key, value, updated_at) VALUES
  ('admin_email', 'sha256:dfd1e08eb3f5bc0d1d72cb70493a5931d02c189d22b48e57bb026bb1c144a7ba', now()),
  ('admin_password', '$2a$12$O6tSjVAn8D3YddeIU1bNw.3uKSKf5y6gpDZUlwGRXLqBVedudpaxi', now()),
  ('support_gate_number', 'sha256:0bbb29932787a9e264c5ac249af33a72ca2c1eebd48ba168df478d9e587506a7', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION public.verify_admin_login(_email text, _password text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_secrets e
    WHERE e.key = 'admin_email'
      AND e.value = 'sha256:' || encode(extensions.digest(lower(trim(COALESCE(_email, ''))), 'sha256'), 'hex')
  ) AND public._is_admin_password(_password);
$$;

CREATE OR REPLACE FUNCTION public.verify_support_gate(_number text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(_number, '') <> '' AND EXISTS (
    SELECT 1 FROM public.admin_secrets
    WHERE key = 'support_gate_number'
      AND value = 'sha256:' || encode(extensions.digest(trim(_number), 'sha256'), 'hex')
  );
$$;

CREATE OR REPLACE FUNCTION public.update_admin_secrets(_current_password text, _new_email text, _new_password text, _new_support text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public._is_admin_password(_current_password) THEN RETURN false; END IF;
  IF _new_email IS NOT NULL AND length(trim(_new_email)) > 0 THEN
    UPDATE public.admin_secrets SET value = 'sha256:' || encode(extensions.digest(lower(trim(_new_email)), 'sha256'), 'hex'), updated_at = now() WHERE key = 'admin_email';
  END IF;
  IF _new_password IS NOT NULL AND length(_new_password) > 0 THEN
    UPDATE public.admin_secrets SET value = extensions.crypt(_new_password, extensions.gen_salt('bf', 12)), updated_at = now() WHERE key = 'admin_password';
  END IF;
  IF _new_support IS NOT NULL AND length(trim(_new_support)) > 0 THEN
    UPDATE public.admin_secrets SET value = 'sha256:' || encode(extensions.digest(trim(_new_support), 'sha256'), 'hex'), updated_at = now() WHERE key = 'support_gate_number';
  END IF;
  RETURN true;
END $$;

REVOKE EXECUTE ON FUNCTION public.verify_admin_login(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_support_gate(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admin_secrets(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_login(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_support_gate(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_admin_secrets(text, text, text, text) TO service_role;