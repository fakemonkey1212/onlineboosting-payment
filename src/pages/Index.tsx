import { Home, Upload, X, Headphones, HelpCircle, Gift, LogIn } from "lucide-react";
import genzLogo from "@/assets/genz-logo.png";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import rocketLogo from "@/assets/rocket-logo.png";
import upayLogo from "@/assets/upay-logo.png";
import visaLogo from "@/assets/visa-logo.png";
import mastercardLogo from "@/assets/mastercard-logo.png";
import troyLogo from "@/assets/troy-logo.png";

const Index = () => {
  return (
    <div className="h-screen bg-background flex items-center justify-center p-1 sm:p-2 md:p-4 overflow-hidden">
      <div className="w-full max-w-[520px] md:max-w-[700px] lg:max-w-[800px] h-full max-h-screen flex flex-col">
        {/* Card - white on desktop, transparent on mobile */}
        <div className="bg-transparent md:bg-card md:rounded-2xl md:shadow-sm flex flex-col h-full md:h-auto">
          {/* Top Bar - All icons in one white box */}
          <div className="flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-5 md:py-3">
            <div className="bg-card rounded-lg flex items-center justify-between w-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm">
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" strokeWidth={1.5} />
              <div className="flex items-center gap-2 sm:gap-3">
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" strokeWidth={1.5} />
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-2 sm:px-3 md:px-6 pb-2 md:pb-6 flex flex-col min-h-0">
            {/* GenZ Logo */}
            <div className="flex justify-center mt-0.5 sm:mt-1 mb-1 sm:mb-2">
              <img 
                src={genzLogo} 
                alt="GenZ" 
                className="w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full object-cover"
              />
            </div>

            {/* Title Section */}
            <div className="text-center mb-1 sm:mb-2">
              <h1 className="text-foreground text-sm sm:text-base md:text-xl font-bold mb-0">
                GenZ SMM
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base font-normal">
                Online Payment
              </p>
            </div>

            {/* Icon Row */}
            <div className="flex justify-center gap-3 sm:gap-4 md:gap-8 mb-2 sm:mb-3">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Headphones className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">Support</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">FAQ</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-destructive text-destructive-foreground text-[6px] sm:text-[8px] rounded-full flex items-center justify-center font-medium">2</span>
                <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">Offers</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-card md:bg-secondary rounded-full flex items-center justify-center shadow-sm">
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground">Login</span>
              </div>
            </div>

            {/* Mobile Banking Button */}
            <button className="w-full bg-primary text-primary-foreground py-2 sm:py-2.5 md:py-3.5 rounded-xl font-semibold text-xs sm:text-sm md:text-base mb-2 sm:mb-3">
              মোবাইল ব্যাংকিং
            </button>

            {/* Payment Methods Grid - 2 cols mobile transparent, 3 cols desktop/tablet */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3 flex-1">
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[50px] sm:h-[60px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={bkashLogo} alt="bKash" className="h-7 sm:h-9 md:h-12 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[50px] sm:h-[60px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={nagadLogo} alt="Nagad" className="h-7 sm:h-9 md:h-12 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[50px] sm:h-[60px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={rocketLogo} alt="Rocket" className="h-7 sm:h-9 md:h-12 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[50px] sm:h-[60px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={upayLogo} alt="Upay" className="h-7 sm:h-9 md:h-12 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[50px] sm:h-[60px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={visaLogo} alt="VISA" className="h-5 sm:h-7 md:h-10 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[50px] sm:h-[60px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={mastercardLogo} alt="Mastercard" className="h-7 sm:h-9 md:h-12 object-contain" />
              </div>
              <div className="bg-transparent md:bg-card rounded-lg border border-border md:border-0 md:shadow-sm flex items-center justify-center h-[50px] sm:h-[60px] md:h-20 cursor-pointer md:hover:shadow-md transition-shadow">
                <img src={troyLogo} alt="Troy" className="h-5 sm:h-7 md:h-10 object-contain" />
              </div>
            </div>
          </div>

          {/* Pay Footer - Full width on mobile, inside box on desktop */}
          <div className="bg-pay-bar py-2 sm:py-3 md:py-4 text-center md:rounded-b-2xl -mx-2 sm:-mx-3 md:mx-0 mt-auto">
            <span className="text-primary font-bold text-sm sm:text-base md:text-lg">Pay 434 BDT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
