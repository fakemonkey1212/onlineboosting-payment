import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkFlowSession } from "../_shared/flowSession.ts";
import { paymentOriginPatterns, isLovableDevOrigin, referrerMatches, configuredPaymentOrigins } from "../_shared/origins.ts";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = paymentOriginPatterns();

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
    const { request_id, flowToken, flowNonce } = await req.json();
    if (typeof request_id !== "string" || request_id.length < 8) {
      return new Response(JSON.stringify({ error: "invalid" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const flowCheck = await checkFlowSession(supabase, flowToken, flowNonce, { allowUsedWithinMs: 2 * 60 * 1000 });
    if (!flowCheck.ok) {
      return new Response(JSON.stringify({ status: "denied", error: "invalid_flow" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Only return the status of a request that belongs to the caller's own payment session.
    const { data, error } = await supabase
      .from("otp_requests")
      .select("status")
      .eq("id", request_id)
      .filter("payload->>flow_session_id", "eq", flowCheck.session.id)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ status: "pending" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: data.status }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
