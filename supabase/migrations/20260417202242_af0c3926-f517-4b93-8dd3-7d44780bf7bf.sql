CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update app_settings" ON public.app_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES ('badge_color', 'slate')
ON CONFLICT (key) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;