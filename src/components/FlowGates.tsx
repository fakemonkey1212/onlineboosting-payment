import { ReactNode, useEffect, useRef, useState } from "react";
import { readRedirectAmount, removeRedirectRef } from "@/lib/redirectAmount";
import { useNavigate, useParams } from "react-router-dom";
import { startFlowSession, validateFlowSession, type FlowState } from "@/lib/flowSession";
import FlowLoading from "@/components/FlowLoading";
import ProcessingScreen from "@/components/ProcessingScreen";
import { getPublicAppSetting } from "@/lib/backend-api";
import { bumpAssetVersion } from "@/lib/assetVersion";
import {
  markAccessBlocked, storeAllowedReferrerOrigin, isAccessBlocked, clearAccessBlocked, exitToReferrer,
} from "@/hooks/useReferrerGuard";
import { isLovableHost } from "@/hooks/useReferrerGuard";

const TOKEN_RE = /^[A-Za-z0-9]{25}$/;

const cancel = (navigate: ReturnType<typeof useNavigate>) => {
  markAccessBlocked();
  navigate("/payment-cancelled", { replace: true });
};

const isExternalReferrer = () => {
  try {
    return !!document.referrer && new URL(document.referrer).origin !== window.location.origin;
  } catch { return false; }
};

const isReturningToMain = () => {
  try { return sessionStorage.getItem("genz_skip_gateway") === "true"; } catch { return false; }
};

// In-memory (this page opening only) record of tokens the server has already
// approved, so moving between pages renders instantly while the server check
// re-runs in the background and still cancels the flow if it fails.
const validatedFlows = new Map<string, FlowState>();
const flowKey = (token: string, platform?: string) => `${token}|${platform ?? ""}`;

const displayKeys = (platform?: string) => {
  const method = platform === "visa" || platform === "mastercard" ? "card" : platform;
  return method
    ? [`merchant_${method}`, `inv_${method}`, `logo_${method}`]
    : ["gateway_name", "gateway_logo", "badge_color", "otp_approval_mode"];
};

const validateAndPrefetch = async (token: string, platform?: string) => {
  const [s] = await Promise.all([
    validateFlowSession(token, platform),
    Promise.all(displayKeys(platform).map(getPublicAppSetting)).catch(() => null),
  ]);
  if (s) validatedFlows.set(flowKey(token, platform), s);
  else validatedFlows.delete(flowKey(token, platform));
  return s;
};

/** Validates the next page's token ahead of navigation so it opens instantly. */
export const prevalidateFlow = async (token: string, platform?: string) => !!(await validateAndPrefetch(token, platform).catch(() => null));

/** First entry: asks the server for a brand-new single-use token, then shows only the token in the URL. */
export const FlowEntry = () => {
  const navigate = useNavigate();
  const entryAmount = useRef<ReturnType<typeof readRedirectAmount> | null>(null);
  useEffect(() => {
    let alive = true;
    // After a cancel, this tab may only restart via a fresh visit from an external referrer.
    if (isAccessBlocked()) {
      if (!isExternalReferrer()) { exitToReferrer(); return; }
      clearAccessBlocked();
    }
    (async () => {
      // রেফারার ছাড়া সরাসরি সাইটে ঢুকলে সাথে সাথে ক্যান্সেল পেজে পাঠাবে
      if (!document.referrer && !isLovableHost(window.location.origin)) {
        return cancel(navigate);
      }
      
      let stored = "";
      try { stored = sessionStorage.getItem("genz_entry_query_v1") || ""; sessionStorage.removeItem("genz_entry_query_v1"); } catch { /* ignore */ }
      if (!entryAmount.current) entryAmount.current = readRedirectAmount(window.location.search || stored);
      removeRedirectRef();
      if (entryAmount.current.invalid) return cancel(navigate);
      const token = await startFlowSession(document.referrer || "", entryAmount.current.amount);
      if (!alive) return;
      if (!token) return cancel(navigate);
      if (document.referrer) storeAllowedReferrerOrigin(document.referrer);
      navigate(`/checkout/${token}`, { replace: true });
    })();
    return () => { alive = false; };
  }, [navigate]);
  return <ProcessingScreen />;
};

/** Every flow page validates its token on the server before rendering. */
export const FlowTokenGate = ({ platform, children }: { platform?: string; children: ReactNode }) => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [ok, setOk] = useState(() => validatedFlows.has(flowKey(token, platform)));

  // ✅ FlowTokenGate-এর ভেতরে (লাইন ৮৭-এর পর):
  useEffect(() => {
    let alive = true;
    
    // টোকেন অবৈধ ফরম্যাট হলে সাথে সাথে Cancel Page
    if (!token || !TOKEN_RE.test(token)) {
      cancel(navigate);
      return;
    }

    const cached = validatedFlows.has(flowKey(token, platform));
    setOk(cached);
    if (isAccessBlocked()) { exitToReferrer(); return; }
    
    (async () => {
      const s = await validateAndPrefetch(token, platform).catch(() => null);
      if (!alive) return;
      if (!s) return cancel(navigate); // এক্সপায়ার্ড বা অবৈধ হলে সরাসরি ক্যান্সেল
      if (s.referrerOrigin) storeAllowedReferrerOrigin(s.referrerOrigin);
      if (!cached) { bumpAssetVersion(); setOk(true); }
    })();
    const onShow = (e: PageTransitionEvent) => {
      if (isAccessBlocked()) return exitToReferrer();
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => { alive = false; window.removeEventListener("pageshow", onShow); };
  }, [token, platform, navigate]);

  if (ok) return <>{children}</>;
  if (!platform && !isReturningToMain()) return <ProcessingScreen />;
  return <FlowLoading />;
};
