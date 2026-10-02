import { supabase } from "@/integrations/supabase/client";

/**
 * Server-issued, single-use payment flow session.
 * The URL carries only the 25-char token; amount/platform/referrer/order live on the server.
 * A per-tab nonce (hashed server-side) binds the token to this browser session.
 */
const NONCE_KEY = "genz_flow_nonce_v1";
const STATE_KEY = "genz_flow_session_v1";
const PARAMS_KEY = "genz_flow_params_v1";

export type FlowState = {
  token: string;
  amount: string;
  platform: string | null;
  orderId: string;
  referrerOrigin: string;
};

export const getFlowNonce = (): string => {
  try {
    let n = sessionStorage.getItem(NONCE_KEY);
    if (!n) {
      const buf = new Uint8Array(24);
      crypto.getRandomValues(buf);
      n = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem(NONCE_KEY, n);
    }
    return n;
  } catch {
    return "";
  }
};

export const getFlowState = (): FlowState | null => {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as FlowState) : null;
  } catch {
    return null;
  }
};

const setFlowState = (s: FlowState | null) => {
  try {
    if (s) sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(STATE_KEY);
  } catch { /* ignore */ }
};

/** Non-URL page params (reason, channel, ref...) passed between screens. */
export const getVirtualParams = (): string => {
  try { return sessionStorage.getItem(PARAMS_KEY) || ""; } catch { return ""; }
};
export const setVirtualParams = (q: string) => {
  try { sessionStorage.setItem(PARAMS_KEY, q); } catch { /* ignore */ }
};

export const formatFlowAmount = (amount: string | undefined | null) => {
  if (!amount || !/^(0|[1-9]\d{0,8})(\.\d{1,8})?$/.test(amount) || Number(amount) <= 0) return "00";
  return amount;
};

async function call<T>(action: string, payload: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await supabase.functions.invoke("flow-session", {
    body: { action, nonce: getFlowNonce(), ...payload },
  });
  if (error) return null;
  return data as T;
}

export const startFlowSession = async (referrer: string, amount: string | null): Promise<string | null> => {
  const res = await call<{ token?: string }>("start", { referrer, amount });
  return res?.token ?? null;
};

export const validateFlowSession = async (token: string, platform?: string): Promise<FlowState | null> => {
  const res = await call<{
    valid: boolean; amount: string; platform: string | null; orderId: string; referrerOrigin: string;
  }>("validate", { token, platform });
  if (!res?.valid) return null;
  const state: FlowState = {
    token,
    amount: res.amount,
    platform: res.platform,
    orderId: res.orderId,
    referrerOrigin: res.referrerOrigin,
  };
  setFlowState(state);
  return state;
};

export const bindFlowPlatform = async (platform: string): Promise<boolean> => {
  const s = getFlowState();
  if (!s) return false;
  const res = await call<{ ok?: boolean }>("bind", { token: s.token, platform });
  if (res?.ok) setFlowState({ ...s, platform });
  return !!res?.ok;
};

/** Marks the token used/revoked on the server. Keeps local state for display (amount on cancel page). */
export const completeFlowSession = async (): Promise<void> => {
  const s = getFlowState();
  if (!s || (s as FlowState & { done?: boolean }).done) return;
  try { sessionStorage.setItem(STATE_KEY, JSON.stringify({ ...s, done: true })); } catch { /* ignore */ }
  await call("complete", { token: s.token });
};

/** Token + nonce for server-side validation on other edge functions. */
export const flowAuth = () => {
  const s = getFlowState();
  return { flowToken: s?.token ?? "", flowNonce: getFlowNonce() };
};
