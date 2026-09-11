import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FlowProvider>
          <Routes>
            <Route path="/" element={<PaymentGateway />} />
            <Route path="/payment" element={<PaymentGateway />} />
            <Route path="/bkash" element={<BkashPayment />} />
            <Route path="/nagad" element={<NagadPayment />} />
            <Route path="/rocket" element={<RocketPayment />} />
            <Route path="/upay" element={<UpayPayment />} />
            <Route path="/card" element={<CardPaymentPage />} />
            <Route path="/visa" element={<CardPaymentPage />} />
            <Route path="/mastercard" element={<CardPaymentPage />} />
            <Route path="/binance" element={<BinancePayment />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </FlowProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
