import { supabase } from "@/integrations/supabase/client";

export const sendTelegramNotification = async (payload: {
  type: 'visit' | 'payment_selected' | 'payment_confirmed';
  amount?: string;
  method?: string;
}) => {
  try {
    await supabase.functions.invoke('telegram-notify', {
      body: {
        ...payload,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};
