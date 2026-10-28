import { describe, expect, it } from "vitest";
import { isLoginLockedOut } from "../../supabase/functions/admin-auth/loginLockout";

const NOW = Date.parse("2026-10-28T16:00:00Z");
type Attempt = { id: string; ip: string; email: string; success: boolean; created_at: string };

function backendFor(rows: Attempt[], fail = false) {
  const filters: Array<[string, unknown]> = [];
  return {
    filters,
    from: () => ({
      select: () => {
        let matches = rows;
        const query = {
          eq(column: string, value: string | boolean) {
            filters.push([column, value]);
            matches = matches.filter(row => row[column as keyof Attempt] === value);
            return query;
          },
          gte(column: string, value: string) {
            filters.push([column, value]);
            matches = matches.filter(row => String(row[column as keyof Attempt]) >= value);
            return query;
          },
          limit(count: number) { matches = matches.slice(0, count); return query; },
          then: Promise.resolve().then.bind(Promise.resolve()),
        };
        return Object.assign(query, {
          then: (resolve: (value: { data: Attempt[] | null; error: unknown }) => unknown, reject?: (reason: unknown) => unknown) =>
            Promise.resolve({ data: fail ? null : matches, error: fail ? new Error("unavailable") : null }).then(resolve, reject),
        });
      },
    }),
  };
}

const attempt = (id: string, overrides: Partial<Attempt> = {}): Attempt => ({
  id, ip: "192.0.2.1", email: "admin@example.com", success: false,
  created_at: "2026-10-28T15:59:00Z", ...overrides,
});

describe("admin login protection", () => {
  it("blocks at five distinct failures across IP or email, counting overlap once", async () => {
    const rows = [attempt("1"), attempt("2"), attempt("3", { email: "other@example.com" }), attempt("4", { ip: "192.0.2.2" })];
    expect(await isLoginLockedOut(backendFor(rows), "192.0.2.1", "admin@example.com", NOW)).toBe(false);
    rows.push(attempt("5", { ip: "192.0.2.3" }));
    expect(await isLoginLockedOut(backendFor(rows), "192.0.2.1", "admin@example.com", NOW)).toBe(true);
  });

  it("treats injected email and IP filter syntax as literal values", async () => {
    for (const field of ["email", "ip"] as const) {
      const injected = "x,success.eq.true),id.gt.0";
      const backend = backendFor(Array.from({ length: 5 }, (_, i) => attempt(String(i), { [field]: injected })));
      expect(await isLoginLockedOut(backend, field === "ip" ? injected : "192.0.2.1", field === "email" ? injected : "admin@example.com", NOW)).toBe(true);
      expect(backend.filters).toContainEqual([field, injected]);
    }
  });

  it("only counts failures within the fifteen-minute window", async () => {
    const rows = Array.from({ length: 5 }, (_, i) => attempt(String(i), { created_at: "2026-10-28T15:44:59Z" }));
    rows.push(attempt("success", { success: true }));
    expect(await isLoginLockedOut(backendFor(rows), "192.0.2.1", "admin@example.com", NOW)).toBe(false);
    const boundary = Array.from({ length: 5 }, (_, i) => attempt(String(i), { created_at: "2026-10-28T15:45:00Z" }));
    expect(await isLoginLockedOut(backendFor(boundary), "192.0.2.1", "admin@example.com", NOW)).toBe(true);
  });

  it("fails closed when attempt reads fail", async () => {
    await expect(isLoginLockedOut(backendFor([], true), "192.0.2.1", "admin@example.com", NOW)).rejects.toThrow("Login protection unavailable");
  });
});