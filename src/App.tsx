import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BkashPayment from "./pages/BkashPayment";
import NagadPayment from "./pages/NagadPayment";
import CardSelectPage from "./pages/CardSelectPage";
import RocketPayment from "./pages/RocketPayment";
import UpayPayment from "./pages/UpayPayment";
import PaymentCancelled from "./pages/PaymentCancelled";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bkash" element={<BkashPayment />} />
          <Route path="/nagad" element={<NagadPayment />} />
          <Route path="/card-select" element={<CardSelectPage />} />
          <Route path="/rocket" element={<RocketPayment />} />
          <Route path="/upay" element={<UpayPayment />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
