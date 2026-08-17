import { supabase } from "@/integrations/supabase/client";

interface TrackingData {
  action: string;
  platform?: string;
  service?: string;
  link?: string;
  price?: number;
  [key: string]: unknown;
}

// Serial queue with 1s spacing to avoid Telegram flood limits.
const queue: TrackingData[] = [];
let processing = false;

async function drain() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const data = queue.shift()!;
    try {
      const { error } = await supabase.functions.invoke("telegram-notify", {
        body: {
          ...data,
          userAgent: navigator.userAgent,
          referrer: document.referrer || "Direct",
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Telegram notification failed:", err);
    }
    if (queue.length > 0) await new Promise((r) => setTimeout(r, 1000));
  }
  processing = false;
}

export async function sendTelegramNotification(data: TrackingData) {
  // Only forward actions the backend actually formats.
  if (data.action !== "service_click" && data.action !== "order_submit") return;
  queue.push(data);
  drain();
}
