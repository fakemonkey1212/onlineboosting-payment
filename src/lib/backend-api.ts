import { supabase } from "@/integrations/supabase/client";

type PaymentMethodRow = { id: string; enabled: boolean };

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


export const getEnabledPaymentMethods = () =>
  backendRequest<string[]>("getEnabledPaymentMethods");

export const adminListPaymentMethods = (password: string) =>
  backendRequest<PaymentMethodRow[]>("adminListPaymentMethods", { password });

export const verifyAdminLogin = (email: string, password: string) =>
  backendRequest<boolean>("verifyAdminLogin", { email, password });

export const adminSetPaymentMethodEnabled = (password: string, id: string, enabled: boolean) =>
  backendRequest<boolean>("adminSetPaymentMethodEnabled", { password, id, enabled });

export const adminSetAppSetting = (password: string, key: string, value: string) =>
  backendRequest<boolean>("adminSetAppSetting", { password, key, value });

export const updateAdminSecrets = (payload: AdminSecretsUpdate) =>
  backendRequest<boolean>("updateAdminSecrets", payload);

export const getPublicAppSetting = async (key: string) => {
  try {
    return await backendRequest<string | null>("getPublicAppSetting", { key });
  } catch {
    return null;
  }
};


export const verifySupportGate = (number: string) =>
  backendRequest<boolean>("verifySupportGate", { number });
