export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const MAX_LOGIN_ATTEMPTS = 5;

type Attempt = { id: string };
type Result = { data: Attempt[] | null; error: unknown };
interface AttemptQuery extends PromiseLike<Result> {
  eq(column: string, value: string | boolean): AttemptQuery;
  gte(column: string, value: string): AttemptQuery;
  limit(count: number): AttemptQuery;
}
export interface AttemptsBackend {
  from(table: string): { select(columns: string): AttemptQuery };
}

export async function isLoginLockedOut(
  backend: AttemptsBackend,
  ip: string,
  email: string,
  now = Date.now(),
): Promise<boolean> {
  const since = new Date(now - LOGIN_WINDOW_MS).toISOString();
  const attemptsFor = (column: string, value: string) => backend
    .from("admin_login_attempts")
    .select("id")
    .eq("success", false)
    .gte("created_at", since)
    .eq(column, value)
    .limit(MAX_LOGIN_ATTEMPTS);

  // Keep caller values out of filter syntax; deduplicate overlapping matches.
  const results = await Promise.all([attemptsFor("ip", ip), attemptsFor("email", email)]);
  if (results.some(({ error, data }) => error || data === null)) {
    throw new Error("Login protection unavailable");
  }
  const ids = new Set(results.flatMap(({ data }) => (data ?? []).map(({ id }) => id)));
  return ids.size >= MAX_LOGIN_ATTEMPTS;
}