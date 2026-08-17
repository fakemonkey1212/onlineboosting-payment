
CREATE OR REPLACE FUNCTION public.get_enabled_payment_methods()
RETURNS TABLE(id text, name text, enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, enabled FROM public.payment_methods WHERE enabled = true ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.get_public_app_setting(_key text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  IF _key IS NULL OR _key = '' THEN RETURN NULL; END IF;
  IF _key IN ('admin_email','admin_password','support_gate_number') THEN RETURN NULL; END IF;
  SELECT value INTO v FROM public.app_settings WHERE key = _key LIMIT 1;
  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.get_enabled_payment_methods() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_app_setting(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_enabled_payment_methods() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_app_setting(text) TO service_role;
