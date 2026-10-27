import { invokeApi } from "@/lib/apiClient";

/**
 * Server-issued, single-use payment flow session.
 * The URL carries only the 25-char token; amount/platform/referrer/order live on the server.
 * A per-tab nonce (hashed server-side) binds the token to this browser session.
 */
const NONCE_KEY = "genz_flow_nonce_v1";
const STATE_KEY = "genz_flow_session_v1";
const LAST_AMOUNT_KEY = "genz_flow_last_amount_v1";
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
    if (s) {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
      if (formatFlowAmount(s.amount) !== "00") { sessionStorage.setItem(LAST_AMOUNT_KEY, String(s.amount)); try { localStorage.setItem(LAST_AMOUNT_KEY, String(s.amount)); } catch { /* ignore */ } }
    }
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
  const { data, error } = await invokeApi("flow-session", {
    body: { action, nonce: getFlowNonce(), ...payload },
  });
  if (error) return null;
  return data as T;
}

export const startFlowSession = async (referrer: string, amount: string | null, ts: string | null = null, sig: string | null = null): Promise<string | null> => {
  const res = await call<{ token?: string }>("start", { referrer, amount, ts, sig });
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

/** Exact amount of the most recent server-validated session in this tab (for the Cancel page). */
export const getLastFlowAmount = (): string => {
  const cur = formatFlowAmount(getFlowState()?.amount != null ? String(getFlowState()?.amount) : null);
  if (cur !== "00") return cur;
  let v: string | null = null;
  try { v = sessionStorage.getItem(LAST_AMOUNT_KEY); } catch { /* ignore */ }
  if (!v) { try { v = localStorage.getItem(LAST_AMOUNT_KEY); } catch { /* ignore */ } }
  return formatFlowAmount(v);
};
