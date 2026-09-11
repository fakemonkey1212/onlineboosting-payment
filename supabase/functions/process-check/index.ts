import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function corsFor(origin: string | null) {
  const allow = origin && ALLOWED_ORIGIN_PATTERNS.some((r) => r.test(origin)) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsFor(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { user_id } = await req.json();
    if (typeof user_id !== "string" || !/^[A-Z0-9]{4,12}$/.test(user_id)) {
      return new Response(JSON.stringify({ status: "none" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("otp_requests")
      .select("id, status, decided_at, created_at")
      .eq("method", "process")
      .eq("status", "approved")
      .gte("created_at", tenMinAgo)
      .filter("payload->>user_id", "eq", user_id)
      .order("decided_at", { ascending: false })
      .limit(1);

    if (Array.isArray(data) && data.length > 0) {
      return new Response(
        JSON.stringify({ status: "approved", id: data[0].id, decided_at: data[0].decided_at }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ status: "none" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ status: "none" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
