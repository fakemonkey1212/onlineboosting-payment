ALTER TABLE public.payment_sessions
  ADD COLUMN amount_exact text;

UPDATE public.payment_sessions
SET amount_exact = amount::text
WHERE amount_exact IS NULL;

ALTER TABLE public.payment_sessions
  ADD CONSTRAINT payment_sessions_amount_exact_format
  CHECK (amount_exact IS NULL OR amount_exact ~ '^(0|[1-9][0-9]{0,8})(\.[0-9]{1,8})?$');

COMMENT ON COLUMN public.payment_sessions.amount IS 'DEPRECATED: retained for compatibility; exact referrer value is stored in amount_exact.';
COMMENT ON COLUMN public.payment_sessions.amount_exact IS 'Validated payment amount preserved exactly as received from the trusted referrer.';