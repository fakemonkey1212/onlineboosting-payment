import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { startFlowSession, validateFlowSession } from "@/lib/flowSession";
import {
  markAccessBlocked, storeAllowedReferrerOrigin, isAccessBlocked, clearAccessBlocked, exitToReferrer,
} from "@/hooks/useReferrerGuard";

const cancel = (navigate: ReturnType<typeof useNavigate>) => {
  markAccessBlocked();
  navigate("/payment-cancelled", { replace: true });
};

const isExternalReferrer = () => {
  try {
    return !!document.referrer && new URL(document.referrer).origin !== window.location.origin;
  } catch { return false; }
};

/** First entry: asks the server for a brand-new single-use token, then shows only the token in the URL. */
export const FlowEntry = () => {
  const navigate = useNavigate();
  useEffect(() => {
    let alive = true;
    // After a cancel, this tab may only restart via a fresh visit from an external referrer.
    if (isAccessBlocked()) {
      if (!isExternalReferrer()) { exitToReferrer(); return; }
      clearAccessBlocked();
    }
    (async () => {
      let stored = "";
      try { stored = sessionStorage.getItem("genz_entry_query_v1") || ""; sessionStorage.removeItem("genz_entry_query_v1"); } catch { /* ignore */ }
      const amount = new URLSearchParams(window.location.search || stored).get("amount");
      const token = await startFlowSession(document.referrer || "", amount);
      if (!alive) return;
      if (!token) return cancel(navigate);
      if (document.referrer) storeAllowedReferrerOrigin(document.referrer);
      navigate(`/checkout/${token}`, { replace: true });
    })();
    return () => { alive = false; };
  }, [navigate]);
  return null;
};

/** Every flow page validates its token on the server before rendering. */
export const FlowTokenGate = ({ platform, children }: { platform?: string; children: ReactNode }) => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;
    setOk(false);
    // Returning to a flow page after the cancel page (Back button) → leave to the referrer.
    if (isAccessBlocked()) { exitToReferrer(); return; }
    (async () => {
      const s = await validateFlowSession(token, platform);
      if (!alive) return;
      if (!s) return cancel(navigate);
      if (s.referrerOrigin) storeAllowedReferrerOrigin(s.referrerOrigin);
      setOk(true);
    })();
    const onShow = (e: PageTransitionEvent) => {
      if (isAccessBlocked()) return exitToReferrer();
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => { alive = false; window.removeEventListener("pageshow", onShow); };
  }, [token, platform, navigate]);

  return ok ? <>{children}</> : null;
};
