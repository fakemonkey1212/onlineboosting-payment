import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

import NotFound from "./pages/NotFound";
import PaymentGateway from "./pages/PaymentGateway";
import BkashPayment from "./pages/payment/BkashPayment";
import NagadPayment from "./pages/payment/NagadPayment";
import RocketPayment from "./pages/payment/RocketPayment";
import UpayPayment from "./pages/payment/UpayPayment";
import CardPaymentPage from "./pages/payment/CardPaymentPage";
import BinancePayment from "./pages/payment/BinancePayment";
import PaymentCancelled from "./pages/payment/PaymentCancelled";
import { FlowProvider } from "@/lib/flowRouter";
import { FlowEntry, FlowTokenGate } from "@/components/FlowGates";

const queryClient = new QueryClient();

const METHOD_PAGES: Record<string, () => JSX.Element> = {
  bkash: () => <BkashPayment />,
  nagad: () => <NagadPayment />,
  rocket: () => <RocketPayment />,
  upay: () => <UpayPayment />,
  card: () => <CardPaymentPage />,
  visa: () => <CardPaymentPage />,
  mastercard: () => <CardPaymentPage />,
  binance: () => <BinancePayment />,
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
