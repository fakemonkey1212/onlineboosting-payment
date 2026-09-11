CREATE OR REPLACE FUNCTION public.admin_clear_blocked_logs(_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.blocked_access_logs WHERE id IS NOT NULL;
  RETURN true;
END $function$;