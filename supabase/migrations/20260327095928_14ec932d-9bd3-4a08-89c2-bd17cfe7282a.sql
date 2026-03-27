-- Create payment_methods table to store enabled/disabled state
CREATE TABLE public.payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Everyone can read payment methods
CREATE POLICY "Anyone can read payment methods" ON public.payment_methods
FOR SELECT USING (true);

-- Anyone can update (admin auth handled in app with hardcoded credentials)
CREATE POLICY "Anyone can update payment methods" ON public.payment_methods
FOR UPDATE USING (true);

-- Insert default payment methods
INSERT INTO public.payment_methods (id, name, enabled) VALUES
  ('bkash', 'bKash', true),
  ('nagad', 'Nagad', true),
  ('rocket', 'Rocket', false),
  ('upay', 'Upay', false),
  ('visa', 'VISA', true),
  ('mastercard', 'Mastercard', true),
  ('troy', 'Troy', false);

-- Enable realtime for payment_methods
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;