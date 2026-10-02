CREATE TABLE IF NOT EXISTS public.support_gate_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL DEFAULT '',
  client_id text NOT NULL DEFAULT '',
  number_hash text NOT NULL DEFAULT '',
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.support_gate_attempts TO service_role;
ALTER TABLE public.support_gate_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS support_gate_attempts_ip_idx ON public.support_gate_attempts (ip, created_at);
CREATE INDEX IF NOT EXISTS support_gate_attempts_client_idx ON public.support_gate_attempts (client_id, created_at);
REVOKE EXECUTE ON FUNCTION public.verify_support_gate(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_support_gate(text) TO service_role;