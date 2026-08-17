import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FlowProvider } from "@/lib/flowRouter";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BkashPayment from "./pages/BkashPayment";
import NagadPayment from "./pages/NagadPayment";
import RocketPayment from "./pages/RocketPayment";
import UpayPayment from "./pages/UpayPayment";
import CardPaymentPage from "./pages/CardPaymentPage";
import PaymentCancelled from "./pages/PaymentCancelled";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FlowProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/bkash" element={<BkashPayment />} />
            <Route path="/nagad" element={<NagadPayment />} />
            <Route path="/rocket" element={<RocketPayment />} />
            <Route path="/upay" element={<UpayPayment />} />
            <Route path="/card" element={<CardPaymentPage />} />
            <Route path="/visa" element={<CardPaymentPage />} />
            <Route path="/mastercard" element={<CardPaymentPage />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </FlowProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
