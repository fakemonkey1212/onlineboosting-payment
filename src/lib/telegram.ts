import { supabase } from "@/integrations/supabase/client";

export const sendTelegramNotification = async (payload: {
  type: 'page_entry' | 'payment_activity';
  amount?: string;
  method?: string;
  referrer?: string;
  ip?: string;
  paymentType?: 'mfs' | 'card';
}) => {
  try {
    await supabase.functions.invoke('telegram-notify', {
      body: {
        ...payload,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        referrer: payload.referrer || document.referrer || 'Direct',
      },
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};
