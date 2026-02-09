import { Home, Upload, X, Headphones, HelpCircle, Gift, LogIn } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo.png";

const Index = () => {
  return (
    <div className="h-screen bg-background flex items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="w-full max-w-[520px] flex flex-col h-full max-h-[100vh] md:max-h-[85vh]">
        {/* Card - white on desktop, transparent on mobile */}
        <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Top Bar - All icons in one white box */}
          <div className="flex items-center justify-center px-3 py-2 md:px-5 md:py-3">
            <div className="bg-card rounded-lg flex items-center justify-between w-full px-4 py-2 shadow-sm">
              <Home className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-foreground" strokeWidth={1.5} />
                <X className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 md:px-6 pb-3 md:pb-6 flex flex-col">
            {/* GenZ Logo */}
            <div className="flex justify-center mt-1 mb-2">
              <img 
                src={genzLogo} 
                alt="GenZ" 
                className="w-14 h-14 md:w-20 md:h-20 rounded-full object-cover"
              />
            </div>

            {/* Title Section */}
            <div className="text-center mb-2">
              <h1 className="text-foreground text-base md:text-xl font-bold mb-0.5">
                GenZ SMM
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-normal">
                Online Payment
              </p>
            </div>

            {/* Icon Row */}
            <div className="flex justify-center gap-4 md:gap-8 mb-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Headphones className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">Support</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">FAQ</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[8px] rounded-full flex items-center justify-center font-medium">2</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">Offers</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <LogIn className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground">Login</span>
              </div>
            </div>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-2.5 md:py-3.5 rounded-xl font-semibold text-sm md:text-base mb-3">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid - 2 cols mobile, 3 cols desktop, no gaps on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 md:gap-3 flex-1">
              <div className="bg-card border border-border flex items-center justify-center h-16 md:h-20 cursor-pointer hover:shadow-md transition-shadow">
                <img src={bkashLogo} alt="bKash" className="h-8 md:h-10 object-contain" />
              </div>
              <div className="bg-card border border-border flex items-center justify-center h-16 md:h-20 cursor-pointer hover:shadow-md transition-shadow">
                <img src={nagadLogo} alt="Nagad" className="h-8 md:h-10 object-contain" />
              </div>
              <div className="bg-card border border-border flex items-center justify-center h-16 md:h-20 cursor-pointer hover:shadow-md transition-shadow">
                <img src={visaLogo} alt="VISA" className="h-7 md:h-8 object-contain" />
              </div>
              <div className="bg-card border border-border flex items-center justify-center h-16 md:h-20 cursor-pointer hover:shadow-md transition-shadow">
                <img src={mastercardLogo} alt="Mastercard" className="h-8 md:h-10 object-contain" />
              </div>
            </div>
          </div>

          {/* Pay Footer - Full width on mobile */}
          <div className="bg-pay-bar py-3 md:py-4 text-center md:rounded-b-2xl -mx-3 md:mx-0">
            <span className="text-primary font-bold text-base md:text-lg">Pay 434 BDT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
