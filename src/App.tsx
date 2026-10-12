import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

import PaymentGateway from "./pages/PaymentGateway";
import PaymentCancelled from "./pages/payment/PaymentCancelled";
import { FlowProvider } from "@/lib/flowRouter";
import { FlowEntry, FlowTokenGate } from "@/components/FlowGates";
import FlowLoading from "@/components/FlowLoading";

// Method pages load on demand, and are warmed in the background right after start,
// so the first screen downloads less without adding waits when a method is chosen.
const loaders = {
  bkash: () => import("./pages/payment/BkashPayment"),
  nagad: () => import("./pages/payment/NagadPayment"),
  rocket: () => import("./pages/payment/RocketPayment"),
  upay: () => import("./pages/payment/UpayPayment"),
  card: () => import("./pages/payment/CardPaymentPage"),
  binance: () => import("./pages/payment/BinancePayment"),
};
const pages = Object.fromEntries(Object.entries(loaders).map(([k, l]) => [k, lazy(l)]));
if (typeof window !== "undefined") {
  const warm = () => Object.values(loaders).forEach((l) => void l().catch(() => {}));
  (window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300)))(warm);
}

const queryClient = new QueryClient();

const METHOD_PAGES: Record<string, keyof typeof loaders> = {
  bkash: "bkash", nagad: "nagad", rocket: "rocket", upay: "upay",
  card: "card", visa: "card", mastercard: "card", binance: "binance",
};

const MethodRoute = () => {
  const { method = "" } = useParams();
  const Page = METHOD_PAGES[method];
  if (!Page) return <Navigate to="/payment-cancelled" replace />;
  return (
    <FlowTokenGate key={method} platform={method}>
      <Page />
    </FlowTokenGate>
  );
};

const GuardedRoutes = () => (
  <Routes>
    <Route path="/" element={<FlowEntry />} />
    <Route path="/payment" element={<FlowEntry />} />
    <Route path="/checkout/:token" element={<FlowTokenGate><PaymentGateway /></FlowTokenGate>} />
    <Route path="/checkout/:method/:token" element={<MethodRoute />} />
    <Route path="/payment-cancelled" element={<PaymentCancelled />} />
    {["/bkash", "/nagad", "/rocket", "/upay", "/card", "/visa", "/mastercard", "/binance"].map((p) => (
      <Route key={p} path={p} element={<Navigate to="/payment-cancelled" replace />} />
    ))}
    <Route path="*" element={<Navigate to="/payment-cancelled" replace />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FlowProvider>
          <GuardedRoutes />
        </FlowProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
