
-- Seed telegram secret rows (values remain blank until admin sets them)
INSERT INTO public.admin_secrets (key, value)
SELECT 'telegram_bot_token', ''
WHERE NOT EXISTS (SELECT 1 FROM public.admin_secrets WHERE key = 'telegram_bot_token');

INSERT INTO public.admin_secrets (key, value)
SELECT 'telegram_chat_id', ''
WHERE NOT EXISTS (SELECT 1 FROM public.admin_secrets WHERE key = 'telegram_chat_id');

-- Password-gated updater for Telegram credentials
CREATE OR REPLACE FUNCTION public.admin_update_telegram(
  _current_password text,
  _new_bot_token text,
  _new_chat_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_current_password) THEN
    RETURN false;
  END IF;

  IF _new_bot_token IS NOT NULL AND length(trim(_new_bot_token)) > 0 THEN
    INSERT INTO public.admin_secrets (key, value)
    VALUES ('telegram_bot_token', trim(_new_bot_token))
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  END IF;

  IF _new_chat_id IS NOT NULL AND length(trim(_new_chat_id)) > 0 THEN
    INSERT INTO public.admin_secrets (key, value)
    VALUES ('telegram_chat_id', trim(_new_chat_id))
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_telegram(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_telegram(text,text,text) TO anon, authenticated, service_role;

-- Password-gated status check (returns whether values are configured, not the values themselves)
CREATE OR REPLACE FUNCTION public.admin_telegram_status(_password text)
RETURNS TABLE(bot_configured boolean, chat_configured boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT
      COALESCE((SELECT length(trim(value)) > 0 FROM public.admin_secrets WHERE key='telegram_bot_token'), false),
      COALESCE((SELECT length(trim(value)) > 0 FROM public.admin_secrets WHERE key='telegram_chat_id'), false);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_telegram_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_telegram_status(text) TO anon, authenticated, service_role;

-- Also ensure admin_secrets has PK on key for ON CONFLICT to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_secrets_pkey'
  ) THEN
    ALTER TABLE public.admin_secrets ADD PRIMARY KEY (key);
  END IF;
END $$;
