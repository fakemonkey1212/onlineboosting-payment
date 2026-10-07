// Per-opening memory snapshot: never hydrate visitor display data from old storage.
const values = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

export const readDisplaySetting = (key: string): string | null | undefined => values.get(key);

export const loadDisplaySetting = (
  key: string,
  fetchValue: () => Promise<string | null>,
): Promise<string | null> => {
  const existing = pending.get(key);
  if (existing) return existing;
  const request = fetchValue().then((value) => {
    values.set(key, value);
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
};