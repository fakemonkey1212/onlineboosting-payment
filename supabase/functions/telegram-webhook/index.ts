import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function deriveSecret(botToken: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${botToken}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

serve(async (req) => {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  // One-shot self-registration: GET ?setup=1 registers this URL with Telegram.
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("setup") === "1" && botToken) {
      const secret = await deriveSecret(botToken);
      const projectRef = (Deno.env.get("SUPABASE_URL") || "").match(/https:\/\/([^.]+)/)?.[1];
      const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/telegram-webhook`;
      const r = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: secret,
          allowed_updates: ["callback_query"],
        }),
      });
      const body = await r.text();
      return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
    }
    return new Response("ok", { status: 200 });
  }

  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  if (!botToken) return new Response("not_configured", { status: 500 });

  const expected = await deriveSecret(botToken);
  const actual = req.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
  if (actual !== expected) return new Response("unauthorized", { status: 401 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const update = await req.json();
    const cq = update.callback_query;
    if (!cq?.data || !cq?.id) return new Response(JSON.stringify({ ok: true }));

    const otpMatch = String(cq.data).match(/^otp:(approve|deny):([0-9a-f-]{36})$/i);
    const processMatch = String(cq.data).match(/^process:([0-9a-f-]{36})$/i);
    if (!otpMatch && !processMatch) return new Response(JSON.stringify({ ok: true }));

    const decision = processMatch ? "approved" : (otpMatch![1] === "approve" ? "approved" : "denied");
    const requestId = processMatch ? processMatch[1] : otpMatch![2];

    await supabase
      .from("otp_requests")
      .update({ status: decision, decided_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("status", "pending");

    // Acknowledge the button press so Telegram removes the loading spinner
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: cq.id,
        text: processMatch ? "🚀 Processing" : (decision === "approved" ? "✅ Approved" : "❌ Denied"),
      }),
    });

    // Remove buttons from the original message to prevent double-decisions
    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;
    if (chatId && messageId) {
      await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
      });
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch {
    return new Response(JSON.stringify({ ok: true }));
  }
});
