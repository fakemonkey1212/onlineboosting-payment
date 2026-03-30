
CREATE TABLE public.allowed_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read allowed websites"
  ON public.allowed_websites FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert allowed websites"
  ON public.allowed_websites FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update allowed websites"
  ON public.allowed_websites FOR UPDATE TO public USING (true);

CREATE POLICY "Anyone can delete allowed websites"
  ON public.allowed_websites FOR DELETE TO public USING (true);

CREATE TABLE public.blocked_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer text NOT NULL DEFAULT '',
  blocked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blocked logs"
  ON public.blocked_access_logs FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert blocked logs"
  ON public.blocked_access_logs FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can delete blocked logs"
  ON public.blocked_access_logs FOR DELETE TO public USING (true);
