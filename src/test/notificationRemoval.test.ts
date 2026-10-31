import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const sourceFiles = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(dir, entry.name);
  return entry.isDirectory() ? sourceFiles(path) : /\.[jt]sx?$/.test(path) && !path.includes("/test/") ? [path] : [];
});

describe("notification removal", () => {
  it("ships no Telegram sender or approval endpoint calls", () => {
    const sources = [...sourceFiles(resolve(root, "src")), ...sourceFiles(resolve(root, "supabase/functions"))];
    const offenders = sources.filter((path) => !path.endsWith("/types.ts") && /sendTelegramNotification\s*\(|submitOtpForApproval\s*\(|api\.telegram\.org|invokeApi\(['"](?:telegram-notify|otp-status)/.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });
  it("removes the notification and approval function entrypoints", () => {
    for (const name of ["telegram-notify", "telegram-webhook", "otp-status"]) {
      expect(existsSync(resolve(root, `supabase/functions/${name}/index.ts`))).toBe(false);
    }
  });
});