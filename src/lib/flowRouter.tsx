import type { Context } from "react";
import { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from "react";
import { useLocation, useNavigate as rrUseNavigate } from "react-router-dom";
import { getFlowState, getVirtualParams, setVirtualParams, completeFlowSession, formatFlowAmount } from "@/lib/flowSession";
import { clearOtpResume, readOtpResume } from "@/lib/otpResume";

export type FlowView =
  | "home"
  | "payment"
  | "bkash"
  | "bkash2"
  | "nagad"
  | "rocket"
  | "upay"
  | "card"
  | "binance"
  | "cancelled";

const routeToView: Record<string, FlowView> = {
  "/": "home",
  "/payment": "payment",
  "/bkash": "bkash",
  "/bkash2": "bkash2",
  "/nagad": "nagad",
  "/rocket": "rocket",
  "/upay": "upay",
  "/card": "card",
  "/binance": "binance",
  "/payment-cancelled": "cancelled",
};

type CardKind = "visa" | "mastercard" | null;

type Ctx = {
  view: FlowView;
  setView: (v: FlowView) => void;
  params: URLSearchParams;
  setParams: (p: URLSearchParams) => void;
  cardKind: CardKind;
  setCardKind: (v: CardKind) => void;
};

// Share a single context instance across duplicated module copies (HMR / mixed
// import specifiers) so consumers never miss the provider.
const g = globalThis as unknown as { __genzFlowContext?: Context<Ctx | null> };
const FlowContext = g.__genzFlowContext ?? (g.__genzFlowContext = createContext<Ctx | null>(null));

const STORAGE_KEY = "genz_flow_state_v2";

const loadPersisted = () => {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    const otpResume = readOtpResume();
    if (!otpResume) return null;
    const view = otpResume.route === "card" ? "card" : otpResume.route;
    return { view: view as FlowView, params: otpResume.params, cardKind: otpResume.route === "card" ? "visa" as CardKind : null, ts: otpResume.ts };
  } catch {
    return null;
  }
};


export const FlowProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const persisted = loadPersisted();
  const [view, setView] = useState<FlowView>(persisted?.view ?? "home");
  const [params, setParams] = useState<URLSearchParams>(
    new URLSearchParams(location.search || persisted?.params || ""),
  );
  const [cardKind, setCardKind] = useState<CardKind>(persisted?.cardKind ?? null);

  // Normal refresh/re-entry starts from home. OTP pages persist themselves only.
  useEffect(() => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [view, params, cardKind]);

  useEffect(() => {
    setParams(new URLSearchParams(location.search));
  }, [location.search]);



  const value = useMemo(
    () => ({ view, setView, params, setParams, cardKind, setCardKind }),
    [view, params, cardKind],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};

export const useFlow = () => {
  const c = useContext(FlowContext);
  if (!c) {
    // Fail soft: render the home view instead of crashing the whole tree.
    return {
      view: "home" as FlowView,
      setView: () => {},
      params: new URLSearchParams(),
      setParams: () => {},
      cardKind: null as CardKind,
      setCardKind: () => {},
    };
  }
  return c;
};

// Delegates to react-router; also keeps cardKind state in sync for /visa /mastercard.
export const useNavigate = () => {
  const flow = useContext(FlowContext);
  const rr = rrUseNavigate();
  return useCallback(
    (to: string | number, opts?: any) => {
      if (typeof to === "number") {
        rr(to);
        return;
      }
      const [path, query = ""] = String(to).split("?");
      const q = new URLSearchParams(query);
      q.delete("amount");
      setVirtualParams(q.toString());
      if (path === "/" || path === "/payment" || path === "/payment-cancelled") clearOtpResume();
      if (flow) {
        if (path === "/card") flow.setCardKind("visa");
      }
      const state = getFlowState();
      let target: string;
      if (path === "/payment-cancelled") {
        void completeFlowSession();
        target = "/payment-cancelled";
      } else if (path === "/" || path === "/payment") {
        target = state ? `/checkout/${state.token}` : "/payment-cancelled";
      } else {
        const method = path.replace(/^\/+/, "");
        target = state ? `/checkout/${method}/${state.token}` : "/payment-cancelled";
      }
      rr(target, opts);
      window.scrollTo(0, 0);
    },
    [flow, rr],
  );
};

/**
 * Virtual search params: the URL only carries the token, so amount comes from the
 * server-validated session and other page params from in-tab storage.
 */
export const useSearchParams = (): [URLSearchParams, (p: URLSearchParams) => void] => {
  const location = useLocation();
  const sp = useMemo(() => {
    const p = new URLSearchParams(getVirtualParams());
    p.set("amount", formatFlowAmount(getFlowState()?.amount));
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.pathname]);
  return [sp, (p: URLSearchParams) => setVirtualParams(p.toString())];
};

