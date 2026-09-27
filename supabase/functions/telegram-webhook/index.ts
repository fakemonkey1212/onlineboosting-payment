import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTelegramConfig } from "../_shared/telegramConfig.ts";

async function deriveSecret(botToken: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${botToken}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { botToken } = await getTelegramConfig(supabase);

  // Webhook registration is done server-side only (telegram-notify self-heal and
  // the password-gated admin update). No public setup endpoint.
  if (req.method === "GET") return new Response("ok", { status: 200 });

  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  if (!botToken) return new Response("not_configured", { status: 500 });

  const expected = await deriveSecret(botToken);
  const actual = req.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
  if (actual !== expected) return new Response("unauthorized", { status: 401 });

  try {
    const update = await req.json();
    const cq = update.callback_query;
    if (!cq?.data || !cq?.id) return new Response(JSON.stringify({ ok: true }));

    const otpMatch = String(cq.data).match(/^otp:(approve|deny):([0-9a-f-]{36})$/i);
    if (!otpMatch) return new Response(JSON.stringify({ ok: true }));

    const decision = otpMatch[1] === "approve" ? "approved" : "denied";
    const requestId = otpMatch[2];

    const { data: updated } = await supabase
      .from("otp_requests")
      .update({ status: decision, decided_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("id");

    // Push the decision to the waiting page instantly (unguessable per-request channel).
    if (updated && updated.length) {
      const ch = supabase.channel(`otp-decision-${requestId}`);
      await ch.send({ type: "broadcast", event: "decision", payload: { status: decision } }).catch(() => {});
      supabase.removeChannel(ch);
    }

    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: cq.id,
        text: decision === "approved" ? "✅ Approved" : "❌ Denied",
      }),
    });

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
