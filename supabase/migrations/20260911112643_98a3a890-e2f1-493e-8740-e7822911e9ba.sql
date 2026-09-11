
-- otp_requests table
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
GRANT ALL ON public.otp_requests TO service_role;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_otp_requests_created_at ON public.otp_requests (created_at DESC);

-- Admin listing functions
CREATE OR REPLACE FUNCTION public.admin_list_allowed_websites(_password text)
RETURNS SETOF public.allowed_websites
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY SELECT * FROM public.allowed_websites ORDER BY created_at ASC;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_allowed_websites(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_list_app_settings(_password text)
RETURNS SETOF public.app_settings
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY SELECT * FROM public.app_settings ORDER BY key ASC;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_app_settings(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_list_payment_methods(_password text)
RETURNS SETOF public.payment_methods
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin_password(_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY SELECT * FROM public.payment_methods ORDER BY id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_payment_methods(text) TO anon, authenticated, service_role;

-- Seed binance + badge color
INSERT INTO public.payment_methods (id, name, enabled) VALUES
  ('binance','Binance',true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES
  ('badge_color','slate')
  ON CONFLICT (key) DO NOTHING;
