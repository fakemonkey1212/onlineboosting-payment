CREATE TABLE public.payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  order_id text NOT NULL UNIQUE,
  amount integer NOT NULL DEFAULT 0,
  referrer text NOT NULL DEFAULT '',
  referrer_origin text NOT NULL DEFAULT '',
  platform text,
  client_hash text NOT NULL,
  ip text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);
GRANT ALL ON public.payment_sessions TO service_role;
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX payment_sessions_expires_idx ON public.payment_sessions (expires_at);