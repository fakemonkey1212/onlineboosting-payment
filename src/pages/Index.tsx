import { Home, Languages, X } from "lucide-react";
import PaymentMethodCard from "@/components/PaymentMethodCard";
import BkashLogo from "@/components/logos/BkashLogo";
import NagadLogo from "@/components/logos/NagadLogo";
import RocketLogo from "@/components/logos/RocketLogo";
import UpayLogo from "@/components/logos/UpayLogo";
import VisaLogo from "@/components/logos/VisaLogo";
import MastercardLogo from "@/components/logos/MastercardLogo";
import AmexLogo from "@/components/logos/AmexLogo";
import BinanceLogo from "@/components/logos/BinanceLogo";
import TroyLogo from "@/components/logos/TroyLogo";
import DiscoverLogo from "@/components/logos/DiscoverLogo";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] flex flex-col min-h-[90vh]">
        {/* White Card */}
        <div className="bg-card rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <Home className="w-5 h-5 text-muted-foreground" />
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-muted-foreground" />
              <X className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-5 pb-4">
            {/* QAFPAY Logo */}
            <div className="flex justify-center mt-2 mb-3">
              <div className="bg-primary rounded-full px-6 py-2.5 flex flex-col items-center">
                <span className="text-primary-foreground text-lg font-extrabold tracking-wider">QAFPAY</span>
                <div className="flex gap-0.5 mt-0.5">
                  {["#E2136E", "#F6921E", "#1A1F71", "#EB001B", "#006FCF", "#F3BA2F", "#8B2F8B"].map((c, i) => (
                    <div key={i} className="w-3 h-2 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-center text-foreground text-xl font-medium mb-5">
              Online Payment
            </h1>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-base mb-5">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-2 gap-3">
              <PaymentMethodCard><BkashLogo /></PaymentMethodCard>
              <PaymentMethodCard><NagadLogo /></PaymentMethodCard>
              <PaymentMethodCard><RocketLogo /></PaymentMethodCard>
              <PaymentMethodCard><UpayLogo /></PaymentMethodCard>
              <PaymentMethodCard><VisaLogo /></PaymentMethodCard>
              <PaymentMethodCard><MastercardLogo /></PaymentMethodCard>
              <PaymentMethodCard><AmexLogo /></PaymentMethodCard>
              <PaymentMethodCard><BinanceLogo /></PaymentMethodCard>
              <PaymentMethodCard><TroyLogo /></PaymentMethodCard>
              <PaymentMethodCard><DiscoverLogo /></PaymentMethodCard>
            </div>
          </div>

          {/* Pay Footer */}
          <div className="bg-[hsl(var(--pay-bar))] py-3.5 text-center">
            <span className="text-primary font-bold text-lg">Pay 40.00 BDT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
