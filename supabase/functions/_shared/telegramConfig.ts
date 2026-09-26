// Resolves Telegram credentials. Admin Panel values (private admin_secrets table)
// are the source of truth; environment secrets are only a fallback.
// deno-lint-ignore no-explicit-any
export async function getTelegramConfig(backend: any): Promise<{ botToken: string; chatId: string }> {
  let botToken = "";
  let chatId = "";
  try {
    const { data } = await backend
      .from("admin_secrets")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);
    for (const row of (data ?? []) as { key: string; value: string }[]) {
      if (row.key === "telegram_bot_token") botToken = (row.value || "").trim();
      if (row.key === "telegram_chat_id") chatId = (row.value || "").trim();
    }
  } catch (e) {
    console.warn("telegram config read failed:", (e as Error)?.message);
  }
  if (!botToken) botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  if (!chatId) chatId = Deno.env.get("TELEGRAM_CHAT_ID") || "";
  return { botToken, chatId };
}
