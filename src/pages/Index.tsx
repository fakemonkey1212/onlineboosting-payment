import { Home, Upload, X, Headphones, HelpCircle, Gift, LogIn } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] flex flex-col min-h-[85vh]">
        {/* Card - white on desktop, transparent on mobile */}
        <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="w-9 h-9 bg-card md:bg-secondary rounded-lg flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-card md:bg-secondary rounded-lg flex items-center justify-center shadow-sm">
                <Upload className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="w-9 h-9 bg-card md:bg-secondary rounded-lg flex items-center justify-center shadow-sm">
                <X className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 md:px-6 pb-6">
            {/* GenZ Logo */}
            <div className="flex justify-center mt-4 mb-3">
              <img 
                src={genzLogo} 
                alt="GenZ" 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
              />
            </div>

            {/* Title Section */}
            <div className="text-center mb-4">
              <h1 className="text-foreground text-xl md:text-2xl font-bold mb-1">
                GenZ SMM
              </h1>
              <p className="text-muted-foreground text-base md:text-lg font-normal">
                Online Payment
              </p>
            </div>

            {/* Icon Row */}
            <div className="flex justify-center gap-6 md:gap-8 mb-6">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Headphones className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-muted-foreground">Support</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-muted-foreground">FAQ</span>
              </div>
              <div className="flex flex-col items-center gap-1 relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Gift className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">2</span>
                <span className="text-xs text-muted-foreground">Offers</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <LogIn className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-muted-foreground">Login</span>
              </div>
            </div>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-3.5 md:py-4 rounded-xl font-semibold text-base md:text-lg mb-6">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid - 2 cols mobile, 3 cols desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[72px] md:h-[90px] cursor-pointer hover:shadow-md transition-shadow">
                <img src={bkashLogo} alt="bKash" className="h-8 md:h-10 object-contain" />
              </div>
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[72px] md:h-[90px] cursor-pointer hover:shadow-md transition-shadow">
                <img src={nagadLogo} alt="Nagad" className="h-8 md:h-10 object-contain" />
              </div>
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[72px] md:h-[90px] cursor-pointer hover:shadow-md transition-shadow">
                <img src={visaLogo} alt="VISA" className="h-6 md:h-8 object-contain" />
              </div>
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[72px] md:h-[90px] cursor-pointer hover:shadow-md transition-shadow">
                <img src={mastercardLogo} alt="Mastercard" className="h-8 md:h-10 object-contain" />
              </div>
            </div>
          </div>

          {/* Pay Footer */}
          <div className="bg-pay-bar py-4 md:py-5 text-center md:rounded-b-2xl">
            <span className="text-primary font-bold text-lg md:text-xl">Pay 434 BDT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
