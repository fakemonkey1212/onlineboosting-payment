export type AppSettingsValues = Record<string, string>;

const EVENT_NAME = "genz-app-settings-update";
const STORAGE_KEY = "genz_app_settings_sync_v1";
const CHANNEL_NAME = "genz-app-settings-sync";

type SyncPayload = { values: AppSettingsValues; ts: number };

const getBroadcastChannel = () => {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  return new BroadcastChannel(CHANNEL_NAME);
};

export const emitAppSettingsUpdate = (values: AppSettingsValues) => {
  if (typeof window === "undefined") return;
  const payload: SyncPayload = { values, ts: Date.now() };
  window.dispatchEvent(new CustomEvent<SyncPayload>(EVENT_NAME, { detail: payload }));
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
  try {
    const channel = getBroadcastChannel();
    channel?.postMessage(payload);
    channel?.close();
  } catch {}
};

export const subscribeAppSettingsUpdate = (handler: (values: AppSettingsValues) => void) => {
  if (typeof window === "undefined") return () => {};

  const onCustom = (event: Event) => {
    const payload = (event as CustomEvent<SyncPayload>).detail;
    if (payload?.values) handler(payload.values);
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue) as SyncPayload;
      if (payload?.values) handler(payload.values);
    } catch {}
  };

  let channel: BroadcastChannel | null = null;
  try {
    channel = getBroadcastChannel();
    if (channel) channel.onmessage = (event: MessageEvent<SyncPayload>) => {
      if (event.data?.values) handler(event.data.values);
    };
  } catch {}

  window.addEventListener(EVENT_NAME, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, onCustom);
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
};