import { supabase } from "@/integrations/supabase/client";

export const sendTelegramNotification = async (payload: {
  type: 'visit' | 'payment_selected' | 'payment_confirmed' | 'payment_cancelled' | 'page_entry' | 'payment_activity';
  amount?: string;
  method?: string;
  reason?: string;
  refId?: string;
  referrer?: string;
  ip?: string;
  step?: string;
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
