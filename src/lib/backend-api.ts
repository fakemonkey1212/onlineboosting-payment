import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/lib/userId";

type PaymentMethodRow = { id: string; enabled: boolean };
type PaymentMethodsResponse = string[] | PaymentMethodRow[];

type AdminSecretsUpdate = {
  currentPassword: string;
  newEmail?: string | null;
  newPassword?: string | null;
  newSupport?: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function backendRequest<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase.functions.invoke("secure-api", {
      body: { action, ...payload },
    });

    if (!error) {
      if (data && typeof data === "object" && "error" in data && data.error) {
        throw new Error(String((data as { error: unknown }).error));
      }
      return (data as { data: T }).data;
    }

    lastError = error;
    const message = String(error.message || "");
    // Transient edge-runtime failures (503 / degraded service) — retry with backoff.
    const transient = /503|degraded|temporarily unavailable|failed to fetch|network/i.test(message);
    if (!transient) break;
    await sleep(400 * (attempt + 1));
  }

  throw new Error((lastError as Error)?.message || "Backend request failed");
}


export const getEnabledPaymentMethods = async (): Promise<string[]> => {
  const data = await backendRequest<PaymentMethodsResponse>("getEnabledPaymentMethods");
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (typeof item === "string") return [item];
    return item?.enabled === true && typeof item.id === "string" ? [item.id] : [];
  });
};

// ---------------- Admin session (server-side) ----------------
// The session token lives in an HttpOnly cookie set by the server. As a
// fallback for browsers that block cross-site cookies it is also kept in
// memory only (never in storage). The CSRF token is memory-only too.
let adminToken = "";
let adminCsrf = "";
const listeners = new Set<() => void>();
export const onAdminSessionLost = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function adminFetch<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
  };
  if (adminToken) headers["x-admin-session"] = adminToken;
  if (adminCsrf) headers["x-csrf-token"] = adminCsrf;
  const res = await fetch(`${FN_BASE}/${fn}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    if (fn === "secure-api") { adminToken = ""; adminCsrf = ""; listeners.forEach((l) => l()); }
    throw new Error(data?.error || "unauthorized");
  }
  if (!res.ok || data?.error) throw new Error(data?.error || "request_failed");
  return data.data as T;
}

const admin = <T,>(action: string, payload: Record<string, unknown> = {}) =>
  adminFetch<T>("secure-api", { action, ...payload });

export const adminLogin = async (email: string, password: string): Promise<"ok" | "invalid" | "locked"> => {
  try {
    const r = await adminFetch<{ token: string; csrf: string }>("admin-auth", { action: "login", email, password });
    adminToken = r.token; adminCsrf = r.csrf;
    return "ok";
  } catch (e) {
    return (e as Error).message === "too_many_attempts" ? "locked" : "invalid";
  }
};

export const adminResumeSession = async (): Promise<boolean> => {
  try {
    const r = await adminFetch<{ csrf: string } | null>("admin-auth", { action: "session" });
    if (!r?.csrf) return false;
    adminCsrf = r.csrf;
    return true;
  } catch { return false; }
};

export const adminLogout = async () => {
  try { await adminFetch("admin-auth", { action: "logout" }); } catch { /* ignore */ }
  adminToken = ""; adminCsrf = "";
};

export const adminListPaymentMethods = () => admin<PaymentMethodRow[]>("adminListPaymentMethods");
export const adminSetPaymentMethodEnabled = (id: string, enabled: boolean) =>
  admin<boolean>("adminSetPaymentMethodEnabled", { id, enabled });
export const adminSetAppSetting = (key: string, value: string) =>
  admin<boolean>("adminSetAppSetting", { key, value });
export const updateAdminSecrets = (payload: AdminSecretsUpdate) => admin<boolean>("adminUpdateSecrets", payload);
export const updateAdminTelegram = (payload: {
  currentPassword: string;
  newBotToken?: string | null;
  newChatId?: string | null;
}) => admin<boolean>("adminUpdateTelegram", payload);
export const adminTelegramStatus = () => admin<{ bot: boolean; chat: boolean }>("adminTelegramStatus");
export type AllowedWebsite = { id: string; url: string; created_at: string };
export type BlockedLog = { id: string; referrer: string; blocked_at: string };
export const adminListAllowedWebsites = () => admin<AllowedWebsite[]>("adminListAllowedWebsites");
export const adminAddAllowedWebsite = (url: string) => admin<boolean>("adminAddAllowedWebsite", { url });
export const adminUpdateAllowedWebsite = (id: string, url: string) => admin<boolean>("adminUpdateAllowedWebsite", { id, url });
export const adminDeleteAllowedWebsite = (id: string) => admin<boolean>("adminDeleteAllowedWebsite", { id });
export const adminListBlockedLogs = () => admin<BlockedLog[]>("adminListBlockedLogs");
export const adminClearBlockedLogs = () => admin<boolean>("adminClearBlockedLogs");

export const getPublicAppSetting = async (key: string) => {
  try {
    return await backendRequest<string | null>("getPublicAppSetting", { key });
  } catch {
    return null;
  }
};


export const verifySupportGate = (number: string) =>
  backendRequest<boolean>("verifySupportGate", { number, clientId: getUserId() });
