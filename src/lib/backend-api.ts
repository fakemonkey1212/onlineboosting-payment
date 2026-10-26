import { invokeApi, apiBase, apiHeaders } from "@/lib/apiClient";
import { getUserId } from "@/lib/userId";
import { loadDisplaySetting } from "@/lib/publicDisplaySettings";

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
    const { data, error } = await invokeApi("secure-api", {
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


// Latest server answer for this page opening only (never persisted), so pages
// shown again render availability badges instantly while re-checking.
let lastEnabledMethods: string[] | null = null;
let pendingEnabled: Promise<string[]> | null = null;
export const readEnabledPaymentMethods = () => lastEnabledMethods;
export const seedEnabledPaymentMethods = (request: Promise<string[]>) => {
  const p = request.then((ids) => { lastEnabledMethods = ids; return ids; })
    .finally(() => { if (pendingEnabled === p) pendingEnabled = null; });
  pendingEnabled = p;
};

export const fetchEnabledPaymentMethodsFresh = async (): Promise<string[]> => {
    const data = await backendRequest<PaymentMethodsResponse>("getEnabledPaymentMethods");
    return !Array.isArray(data) ? [] : data.flatMap((item) => {
      if (typeof item === "string") return [item];
      return item?.enabled === true && typeof item.id === "string" ? [item.id] : [];
    });
};

export const getEnabledPaymentMethods = async (): Promise<string[]> => {
  if (pendingEnabled) return pendingEnabled;
  pendingEnabled = (async () => {
    const data = await backendRequest<PaymentMethodsResponse>("getEnabledPaymentMethods");
    const ids = !Array.isArray(data) ? [] : data.flatMap((item) => {
      if (typeof item === "string") return [item];
      return item?.enabled === true && typeof item.id === "string" ? [item.id] : [];
    });
    lastEnabledMethods = ids;
    return ids;
  })().finally(() => { pendingEnabled = null; });
  return pendingEnabled;
};

// ---------------- Admin session (server-side) ----------------
// The session token lives in an HttpOnly cookie set by the server. As a
// fallback for browsers that block cross-site cookies it is also kept in
// memory only (never in storage). The CSRF token is memory-only too.
let adminToken = "";
let adminCsrf = "";
const listeners = new Set<() => void>();
export const onAdminSessionLost = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };


async function adminFetch<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = apiHeaders();
  if (adminToken) headers["x-admin-session"] = adminToken;
  if (adminCsrf) headers["x-csrf-token"] = adminCsrf;
  const res = await fetch(`${apiBase()}/${fn}`, {
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

export const fetchPublicAppSettingFresh = async (key: string): Promise<string | null> => {
  try { return await backendRequest<string | null>("getPublicAppSetting", { key }); } catch { return null; }
};

export const getPublicAppSetting = async (key: string) => {
  return loadDisplaySetting(key, async () => {
    try {
      return await backendRequest<string | null>("getPublicAppSetting", { key });
    } catch {
      return null;
    }
  });
};


export const verifySupportGate = (number: string) =>
  backendRequest<boolean>("verifySupportGate", { number, clientId: getUserId() });

export type BinInfo = { bank?: string; country?: string; countryEmoji?: string; type?: string; scheme?: string };
export const lookupCardBin = (bin: string) => backendRequest<BinInfo | null>("binLookup", { bin });
