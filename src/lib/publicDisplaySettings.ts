// Per-opening memory snapshot: never hydrate visitor display data from old storage.
const values = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

export const readDisplaySetting = (key: string): string | null | undefined => values.get(key);

const track = (key: string, request: Promise<string | null>) => {
  const p = request.then((value) => {
    values.set(key, value);
    return value;
  }).finally(() => { if (pending.get(key) === p) pending.delete(key); });
  pending.set(key, p);
  return p;
};

/** Registers an in-flight fresh request so readers share it instead of refetching. */
export const seedDisplaySetting = (key: string, request: Promise<string | null>) => track(key, request);

export const loadDisplaySetting = (
  key: string,
  fetchValue: () => Promise<string | null>,
): Promise<string | null> => pending.get(key) ?? track(key, fetchValue());
