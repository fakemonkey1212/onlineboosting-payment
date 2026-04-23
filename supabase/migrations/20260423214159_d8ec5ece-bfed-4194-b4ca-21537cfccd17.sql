ALTER TABLE public.payment_methods REPLICA IDENTITY FULL;
ALTER TABLE public.allowed_websites REPLICA IDENTITY FULL;
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;
ALTER TABLE public.blocked_access_logs REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
ALTER PUBLICATION supabase_realtime ADD TABLE public.allowed_websites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_access_logs;